import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { UserRole } from '../common/enums/user-role.enum.js';
import { UserSchema } from '../modules/users/schemas/user.schema.js';

const BCRYPT_ROUNDS = 12;

async function seed() {
  const uri =
    process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/recovery-service';
  const login = (process.env.ADMIN_LOGIN ?? 'login').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD ?? 'parol';
  const fullName = process.env.ADMIN_FULL_NAME ?? 'Administrator';

  await mongoose.connect(uri);

  const UserModel =
    mongoose.models.User ?? mongoose.model('User', UserSchema);

  await UserModel.deleteMany({ role: UserRole.ADMIN }).exec();

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await UserModel.create({
    login,
    passwordHash,
    fullName,
    role: UserRole.ADMIN,
    isActive: true,
  });

  console.log(`Admin qayta yaratildi — login: ${login}, parol: (env yoki default)`);
  await mongoose.disconnect();
}

seed().catch(async (error: unknown) => {
  console.error('Seed xatosi:', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
