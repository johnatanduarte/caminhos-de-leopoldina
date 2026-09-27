// src/entities/UserCompletedTrail.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Trail } from "./Trail";

@Entity("user_completed_trails")
export class UserCompletedTrail {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Trail, { onDelete: "CASCADE" })
  @JoinColumn({ name: "trail_id" })
  trail: Trail;

  @CreateDateColumn()
  completed_at: Date;
}
