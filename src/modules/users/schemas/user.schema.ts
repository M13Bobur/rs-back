import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { UserRole } from '../../../common/enums/user-role.enum.js';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret.passwordHash;
      return ret;
    },
  },
})
export class User {
  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  login!: string;

  @Prop({ type: String, lowercase: true, trim: true, sparse: true })
  email?: string;

  @Prop({ type: String, required: true, select: false })
  passwordHash!: string;

  @Prop({ type: String, required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, enum: UserRole, type: String })
  role!: UserRole;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Date })
  createdAt!: Date;

  @Prop({ type: Date })
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
