class FriendsService {
  static async getFriendsList(userId) {
    return {
      friends: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      stats: { totalReferrals: 0, totalBonuses: "0" }
    };
  }
}

module.exports = FriendsService;
