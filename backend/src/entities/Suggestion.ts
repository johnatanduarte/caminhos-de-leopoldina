// src/entities/Suggestion.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { TrailType, Difficulty } from "./Trail";
import { SuggestionPhoto } from "./SuggestionPhoto";

export enum SuggestionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

@Entity("suggestions")
export class Suggestion {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "varchar", length: 150 })
  title: string;

  @Column({ type: "enum", enum: TrailType })
  type: TrailType;

  @Column({ type: "enum", enum: Difficulty, nullable: true })
  difficulty: Difficulty;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  location: string;

  @Column({
    type: "enum",
    enum: SuggestionStatus,
    default: SuggestionStatus.PENDING,
  })
  status: SuggestionStatus;

  @OneToMany(() => SuggestionPhoto, (photo) => photo.suggestion)
  photos: SuggestionPhoto[];

  @CreateDateColumn()
  created_at: Date;
}
