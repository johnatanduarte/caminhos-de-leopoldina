import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("tour_guides")
export class TourGuide {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  cadastur_number: string;

  @Column()
  name: string;

  @Column()
  neighborhood: string;

  @Column({ default: "Guia de Turismo" })
  segment: string;
}