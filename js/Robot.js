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
        this.maxHp = 0;
        this.atk = 0;
        this.hp = template.hp; // se inicializará en recalculateStats si está undefined
        
        this.isOffline = false;
        
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
            this.hp = this.maxHp; // Curar completamente al subir de nivel
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
        
        // Restaurar a base
        this.maxHp = this.baseMaxHp;
        this.atk = this.baseAtk;

        if (this.equippedWeapon) {
            // Bono de afinidad
            if (this.equippedWeapon.element === this.element) {
                this.maxHp = Math.floor(this.maxHp * 1.2);
                this.atk = Math.floor(this.atk * 1.2);
            }
            // Espada +15% de daño base pasivo (+30% si está mejorada)
            if (this.equippedWeapon.type === WEAPON_TYPES.ESPADA) {
                this.atk = Math.floor(this.atk * (this.equippedWeapon.isUpgraded ? 1.30 : 1.15));
            }
        }
        
        // Ajustar el HP actual por la misma diferencia que el HP máximo
        if (oldMaxHp > 0) {
            const diff = this.maxHp - oldMaxHp;
            this.hp = Math.max(1, this.hp + diff); // Asegurar que no muera por cambiar arma, al menos 1 hp
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
                this.statuses.splice(barrierIndex, 1);
                if (attacker && this.element !== 'NEUTRO') {
                    attacker.statuses = attacker.statuses.filter(s => !s.type.startsWith('MARCA_'));
                    attacker.addStatus({ type: `MARCA_${this.element}`, duration: 3 });
                }
            } else {
                this.statuses.splice(barrierIndex, 1);
                if (attacker && this.element !== 'NEUTRO') {
                    attacker.statuses = attacker.statuses.filter(s => !s.type.startsWith('MARCA_'));
                    attacker.addStatus({ type: `MARCA_${this.element}`, duration: 3 });
                }
                return 0; // Daño completamente bloqueado
            }
        }
        
        if (!ignoreDefense && this.hasStatus('DEFENDIENDO')) {
            if (penetrationRatio > 0) {
                // Perfora la reducción de defensa del 50%
                let effectiveReduction = 0.5 * (1 - penetrationRatio);
                finalDamage = Math.floor(finalDamage * (1 - effectiveReduction));
            } else {
                finalDamage = Math.floor(finalDamage * 0.5);
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
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + Math.floor(amount));
        return this.hp - oldHp;
    }

    addStatus(status) {
        if (this.isOffline) return;
        this.statuses.push(status);
    }

    removeStatus(type) {
        this.statuses = this.statuses.filter(s => s.type !== type);
    }

    updateStatuses() {
        if (this.isOffline) return [];
        let messages = [];
        
        for (let i = this.statuses.length - 1; i >= 0; i--) {
            let status = this.statuses[i];
            
            if (status.type === 'BURN') {
                let dmg = Math.floor(this.maxHp * 0.08);
                this.hp -= dmg;
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
        
        // Efecto Báculo: cura 3% max hp (5% si mejorado)
        if (this.equippedWeapon && this.equippedWeapon.type === WEAPON_TYPES.BACULO && this.hp > 0 && this.hp < this.maxHp) {
            let healAmount = Math.max(1, Math.floor(this.maxHp * (this.equippedWeapon.isUpgraded ? 0.05 : 0.03)));
            let actualHeal = this.heal(healAmount);
            messages.push(`${this.name} se cura ${actualHeal} gracias a su Báculo.`);
        }

        // Reducir cooldowns
        this.skills.forEach(skill => {
            if (skill.currentCd > 0) skill.currentCd--;
        });
        
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
