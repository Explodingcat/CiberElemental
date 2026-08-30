// Robot.js

class Robot {
    constructor(template) {
        this.id = template.id || Math.random().toString(36).substr(2, 9);
        this.name = template.name;
        this.element = template.element;
        this.emoji = template.emoji || '🤖';
        
        // Niveles y XP
        this.level = template.level || 1;
        this.xp = template.xp || 0;
        
        this.baseMaxHp = 0;
        this.baseAtk = 0;
        this.spd = 0;
        this.dodge = 0;
        this.acc = 0;
        this.critChance = 0;
        this.maxHp = 0;
        this.atk = 0;
        this.hp = template.hp; // se inicializará en recalculateStats si está undefined
        
        this.isOffline = false;
        this.isAlly = template.isAlly !== undefined ? template.isAlly : (template.isElite ? false : (!this.name.startsWith('Salvaje') && !this.name.startsWith('ÉLITE') && !this.name.includes('Jefe')));
        this.isElite = !!template.isElite;
        this.isBoss = !!template.isBoss;
        
        // Habilidades
        this.skills = template.skills ? JSON.parse(JSON.stringify(template.skills)) : [];
        
        // Estados alterados
        this.statuses = [];

        // Armas
        this.equippedWeapon = null;
        
        // Inicializar stats
        this.recalculateStats();
        if (template.hp === undefined) {
            this.hp = this.maxHp;
        }
    }

    get xpToNext() {
        return this.level * 100;
    }

    gainXp(amount) {
        if (this.isOffline) return false;
        this.xp += amount;
        let leveledUp = false;
        while (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level++;
            leveledUp = true;
        }
        
        if (leveledUp) {
            this.recalculateStats();
        }
        return leveledUp;
    }

    equipWeapon(weapon) {
        this.equippedWeapon = weapon;
        this.recalculateStats();
    }

    recalculateStats() {
        const oldMaxHp = this.maxHp || 0;
        
        // Obtener stats base por elemento
        const elStats = ELEMENT_BASE_STATS[this.element];
        
        // Escalar por nivel (solo HP y ATK)
        this.baseMaxHp = Math.floor(elStats.maxHp * (1 + (this.level - 1) * 0.05));
        this.baseAtk = Math.floor(elStats.atk * (1 + (this.level - 1) * 0.05));
        
        // Los otros stats no escalan con el nivel, son fijos por elemento
        this.spd = elStats.spd;
        this.dodge = elStats.dodge;
        this.acc = elStats.acc;
        this.critChance = elStats.critChance || 5;
        
        // Restaurar a base
        this.maxHp = this.baseMaxHp;
        this.atk = this.baseAtk;

        // Aplicar mejoras pasivas de meta-progresión si es una unidad aliada
        if (this.isAlly && typeof SkillsManager !== 'undefined') {
            let hpMult = SkillsManager.getHpMultiplier();
            if (this.element === ELEMENTS.TIERRA) {
                hpMult += SkillsManager.getModifier('earth_bonus_hp_pct', 0);
            }
            this.maxHp = Math.floor(this.maxHp * hpMult);
            this.atk = Math.floor(this.atk * SkillsManager.getAtkMultiplier());
            this.dodge += SkillsManager.getDodgeBonus();
            this.acc += SkillsManager.getAccBonus();
            this.critChance += SkillsManager.getCritRateBonus();
        }

        if (this.equippedWeapon) {
            // Bono de afinidad (+20% base, aumentado con pasivas de Sintonía de Chasis)
            if (this.equippedWeapon.element === this.element) {
                let affinityMult = 1.20;
                if (this.isAlly && typeof SkillsManager !== 'undefined') {
                    affinityMult += SkillsManager.getAffinityMultiplierBonus();
                }
                this.maxHp = Math.floor(this.maxHp * affinityMult);
                this.atk = Math.floor(this.atk * affinityMult);
            }
            // Espada +15% de daño base pasivo (+30% si está mejorada) y +10% de Crítico en básicos (+20% con +1)
            if (this.equippedWeapon.type === WEAPON_TYPES.ESPADA) {
                let swordDmgMult = this.equippedWeapon.isUpgraded ? 1.30 : 1.15;
                let swordCrit = this.equippedWeapon.isUpgraded ? 20 : 10;
                if (this.isAlly && typeof SkillsManager !== 'undefined') {
                    swordDmgMult += SkillsManager.getModifier('sword_bonus_dmg', 0);
                    swordCrit += SkillsManager.getModifier('sword_bonus_crit', 0);
                }
                this.atk = Math.floor(this.atk * swordDmgMult);
                this.critChance += swordCrit;
            }
        }
        
        // Ajustar el HP actual por la misma diferencia que el HP máximo
        if (oldMaxHp > 0) {
            const diff = this.maxHp - oldMaxHp;
            this.hp = Math.min(this.maxHp, Math.max(1, this.hp + diff)); // Asegurar que no muera por cambiar arma ni supere maxHp
        }
    }

    takeDamage(amount, penetrationRatio = 0, ignoreDefense = false, attacker = null) {
        if (this.isOffline) return 0;
        
        let finalDamage = amount;
        const barrierIndex = this.statuses.findIndex(s => s.type === 'BARRIER');
        
        if (barrierIndex !== -1) {
            if (penetrationRatio > 0) {
                // Perfora el 50% / 75% de la barrera (el daño que entra es amount * penetrationRatio)
                finalDamage = Math.floor(amount * penetrationRatio);
            } else {
                return 0; // Daño completamente bloqueado (100% protección)
            }
        }

        // Absorción de Escudo numérico (ej. Cristalización)
        const shieldIndex = this.statuses.findIndex(s => s.type === 'SHIELD');
        if (shieldIndex !== -1) {
            let shield = this.statuses[shieldIndex];
            if (shield.amount >= finalDamage) {
                shield.amount -= finalDamage;
                if (shield.amount <= 0) {
                    this.statuses.splice(shieldIndex, 1);
                }
                return 0; // Daño completamente absorbido por el escudo
            } else {
                finalDamage -= shield.amount;
                this.statuses.splice(shieldIndex, 1);
            }
        }

        // Rompearmaduras: incrementa el daño recibido un +25%
        if (this.hasStatus('ARMOR_BREAK')) {
            finalDamage = Math.floor(finalDamage * 1.25);
        }
        
        if (!ignoreDefense && this.hasStatus('DEFENDIENDO')) {
            let baseReduction = 0.50;
            if (this.isAlly && typeof SkillsManager !== 'undefined') {
                baseReduction += SkillsManager.getModifier('defend_bonus_reduction', 0); // 0.60 con Modo Fortaleza
            }
            if (penetrationRatio > 0) {
                // Perfora la reducción de defensa
                let effectiveReduction = baseReduction * (1 - penetrationRatio);
                finalDamage = Math.floor(finalDamage * (1 - effectiveReduction));
            } else {
                finalDamage = Math.floor(finalDamage * (1 - baseReduction));
            }
        }

        if (!ignoreDefense && this.hasStatus('CORAZA_ESPINAS')) {
            let baseReduction = 0.50;
            if (penetrationRatio > 0) {
                let effectiveReduction = baseReduction * (1 - penetrationRatio);
                finalDamage = Math.floor(finalDamage * (1 - effectiveReduction));
            } else {
                finalDamage = Math.floor(finalDamage * (1 - baseReduction));
            }
        }
        
        this.hp -= finalDamage;
        if (this.hp <= 0) {
            this.hp = 0;
            this.isOffline = true;
            this.statuses = []; // Limpiar estados al morir
        }
        return finalDamage;
    }

    heal(amount) {
        if (this.isOffline) return 0;
        let effectiveAmount = amount;
        if (this.isAlly && typeof SkillsManager !== 'undefined') {
            effectiveAmount *= (1 + SkillsManager.getModifier('healing_received_pct', 0));
        }
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + Math.floor(effectiveAmount));
        return this.hp - oldHp;
    }

    addStatus(status) {
        if (this.isOffline) return;
        
        // Inmunidad o resistencia a aturdimiento por Firmeza Giroscópica
        if (status.type === 'STUN' && this.isAlly && typeof SkillsManager !== 'undefined') {
            let stunResist = SkillsManager.getModifier('stun_resist_chance', 0);
            if (stunResist > 0 && Math.random() < stunResist) {
                return; // Resistió el aturdimiento con éxito
            }
        }

        // Blindaje de Plasma: duración extendida de barreras para aliados
        if (status.type === 'BARRIER' && this.isAlly && typeof SkillsManager !== 'undefined') {
            let extraDuration = SkillsManager.getModifier('barrier_extra_duration', 0);
            status.duration = (status.duration || 2) + extraDuration;
        }

        this.statuses.push(status);
    }

    clearStatuses() {
        this.statuses = [];
    }

    resetCooldowns() {
        if (this.skills) {
            this.skills.forEach(s => s.currentCd = 0);
        }
    }

    removeStatus(type) {
        this.statuses = this.statuses.filter(s => s.type !== type);
    }

    removeBuffs() {
        const isDebuff = (s) => ['BURN', 'STUN', 'SLOW', 'FROST', 'BLIND', 'ARMOR_BREAK'].includes(s.type) || s.type.startsWith('MARCA_');
        this.statuses = this.statuses.filter(s => isDebuff(s));
    }

    getEffectiveSpeed() {
        let speed = this.spd;
        if (this.hasStatus('SLOW')) {
            speed = Math.max(1, Math.floor(speed * 0.5));
        }
        return speed;
    }

    getEffectiveAcc() {
        let accuracy = this.acc;
        if (this.hasStatus('FROST')) {
            accuracy -= 20;
        }
        if (this.hasStatus('BLIND')) {
            accuracy -= 50;
        }
        return Math.max(5, accuracy);
    }

    updateStatuses() {
        if (this.isOffline) return [];
        let messages = [];
        let totalDamage = 0;
        let totalHeal = 0;
        
        for (let i = this.statuses.length - 1; i >= 0; i--) {
            let status = this.statuses[i];
            
            // DEFENDIENDO, CORAZA_ESPINAS y BARRIER no expiran en fin de ronda global, sino al inicio del siguiente turno de su invocador
            if (status.type === 'DEFENDIENDO' || status.type === 'CORAZA_ESPINAS' || status.type === 'BARRIER') {
                continue;
            }

            if (status.type === 'BURN') {
                let burnRed = (this.isAlly && typeof SkillsManager !== 'undefined') 
                    ? SkillsManager.getModifier('burn_damage_reduction', 0) 
                    : 0;
                let dmg = Math.max(1, Math.floor(this.maxHp * 0.08 * (1 - burnRed)));
                this.hp -= dmg;
                totalDamage += dmg;
                messages.push(`${this.name} sufre ${dmg} por Quemadura.`);
                if (this.hp <= 0) {
                    this.hp = 0;
                    this.isOffline = true;
                }
            }
            
            status.duration--;
            if (status.duration <= 0) {
                this.statuses.splice(i, 1);
            }
        }
        
        // Efecto Báculo: cura 5% max hp (7% si mejorado) + pasiva Báculos de Regeneración
        if (this.equippedWeapon && this.equippedWeapon.type === WEAPON_TYPES.BACULO && this.hp > 0 && this.hp < this.maxHp) {
            let staffExtra = (this.isAlly && typeof SkillsManager !== 'undefined') 
                ? SkillsManager.getModifier('staff_extra_heal', 0) 
                : 0;
            let healRate = (this.equippedWeapon.isUpgraded ? 0.07 : 0.05) + staffExtra;
            let healAmount = Math.max(1, Math.floor(this.maxHp * healRate));
            let actualHeal = this.heal(healAmount);
            if (actualHeal > 0) {
                totalHeal += actualHeal;
                messages.push(`${this.name} se cura ${actualHeal} gracias a su Báculo.`);
            }
        }

        // Reducir cooldowns
        this.skills.forEach(skill => {
            if (skill.currentCd > 0) skill.currentCd--;
        });
        
        messages.damage = totalDamage;
        messages.heal = totalHeal;
        return messages;
    }

    hasStatus(type) {
        return this.statuses.some(s => s.type === type);
    }

    getEmojiGraphic() {
        // Devuelve el emoji base, modificado por el elemento
        return `<span class="elem-${this.element}">${this.emoji}</span>`;
    }
}
