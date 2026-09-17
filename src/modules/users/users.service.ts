import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcrypt';
import type { Model } from 'mongoose';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User, UserDocument } from './schemas/user.schema.js';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const login = createUserDto.login.toLowerCase().trim();
    const existing = await this.userModel.findOne({ login }).exec();

    if (existing) {
      throw new ConflictException('Bu login allaqachon band');
    }

    const passwordHash = await bcrypt.hash(
      createUserDto.password,
      BCRYPT_ROUNDS,
    );

    const user = new this.userModel({
      login,
      email: createUserDto.email?.toLowerCase().trim(),
      passwordHash,
      fullName: createUserDto.fullName,
      role: createUserDto.role,
    });

    return user.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    return user;
  }

  async findByLoginWithPassword(login: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ login: login.toLowerCase().trim() })
      .select('+passwordHash')
      .exec();
  }

  async findByIdForAuth(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.findById(id);

    if (updateUserDto.login && updateUserDto.login !== user.login) {
      const normalized = updateUserDto.login.toLowerCase().trim();
      const duplicate = await this.userModel.findOne({ login: normalized }).exec();
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('Bu login allaqachon band');
      }
      user.login = normalized;
    }

    if (updateUserDto.email !== undefined) {
      user.email = updateUserDto.email
        ? updateUserDto.email.toLowerCase().trim()
        : undefined;
    }

    if (updateUserDto.fullName !== undefined) {
      user.fullName = updateUserDto.fullName;
    }

    if (updateUserDto.role !== undefined) {
      user.role = updateUserDto.role;
    }

    if (updateUserDto.isActive !== undefined) {
      user.isActive = updateUserDto.isActive;
    }

    if (updateUserDto.password) {
      user.passwordHash = await bcrypt.hash(
        updateUserDto.password,
        BCRYPT_ROUNDS,
      );
    }

    return user.save();
  }

  async remove(id: string, actorId?: string): Promise<void> {
    if (actorId && actorId === id) {
      throw new BadRequestException('O‘zingizni o‘chira olmaysiz');
    }
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
  }

  async resetPassword(id: string, password: string): Promise<UserDocument> {
    return this.update(id, { password });
  }

  async ensureSeedAdmin(data: {
    login: string;
    password: string;
    fullName: string;
  }): Promise<UserDocument> {
    const existing = await this.findByLoginWithPassword(data.login);
    if (existing) {
      return existing;
    }

    return this.create({
      login: data.login,
      password: data.password,
      fullName: data.fullName,
      role: UserRole.ADMIN,
    });
  }
}
