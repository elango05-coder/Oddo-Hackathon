const BaseRepository = require('./BaseRepository');
const User = require('../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, selectPassword = false) {
    let query = this.model.findOne({ email });
    if (selectPassword) {
      query = query.select('+password');
    }
    return await query.exec();
  }

  async findByVerificationToken(token) {
    return await this.model.findOne({ verificationToken: token }).select('+verificationToken').exec();
  }

  async findByPasswordResetToken(token) {
    return await this.model.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires').exec();
  }
}

module.exports = new UserRepository();
