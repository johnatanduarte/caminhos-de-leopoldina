// src/entities/Trail.ts
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export enum TrailType {
  TREKKING = "trekking",
  CYCLING = "cycling",
}

export enum Difficulty {
  FACIL = "Fácil",
  MODERADO = "Moderado",
  DIFICIL = "Difícil",
}

@Entity("trails")
export class Trail {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 150 })
  title: string;

  @Column({ type: "enum", enum: TrailType })
  type: TrailType;

  @Column({ type: "enum", enum: Difficulty })
  difficulty: Difficulty;

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
}
