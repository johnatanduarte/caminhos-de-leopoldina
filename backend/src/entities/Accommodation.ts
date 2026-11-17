import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("accommodations")
export class Accommodation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  rating_info: string;
}