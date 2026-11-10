import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

export enum TrailType {
  TREKKING = "trekking",
  CYCLING = "cycling",
}

export enum TrailDifficulty {
  FACIL = "Fácil",
  MODERADO = "Moderado",
  DIFÍCIL = "Difícil",
}

@Entity("trails")
export class Trail {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 150 })
  title: string;

  @Column({ type: "enum", enum: TrailType, default: TrailType.TREKKING })
  type: TrailType;

  @Column({ type: "enum", enum: TrailDifficulty, default: TrailDifficulty.FACIL })
  difficulty: TrailDifficulty;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  distance_km: number;

  @Column({ type: "int" })
  duration_mins: number;

  @Column({ type: "int" })
  elevation_m: number;

  @Column({ type: "text" })
  history: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  image_url: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  audio_url: string;

  // NOVA COLUNA: ID do autor da rota
  @Column({ type: "uuid", nullable: true })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}