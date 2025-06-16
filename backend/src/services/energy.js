class EnergyService {
  static async getEnergyStatus(userId) {
    return {
      current: 1000,
      max: 1000,
      regenRate: 1
    };
  }
}

module.exports = EnergyService;
