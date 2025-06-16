class UpgradeService {
  static async getAvailableUpgrades(userId) {
    return {
      upgrades: [
        { id: 1, name: 'Miner Level 1', price: 0.1, type: 'miner' },
        { id: 2, name: 'Energy Level 1', price: 0.2, type: 'energy' }
      ]
    };
  }
}

module.exports = UpgradeService;
