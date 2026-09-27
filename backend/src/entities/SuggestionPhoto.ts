// src/entities/SuggestionPhoto.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Suggestion } from "./Suggestion";

@Entity("suggestion_photos")
export class SuggestionPhoto {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Suggestion, (suggestion) => suggestion.photos, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "suggestion_id" })
  suggestion: Suggestion;

  @Column({ type: "varchar", length: 255 })
  url: string;
}
