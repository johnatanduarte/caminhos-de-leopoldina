import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Trail } from "./entities/Trail";
import { UserCompletedTrail } from "./entities/UserCompletedTrail";
import { Suggestion } from "./entities/Suggestion";
import { SuggestionPhoto } from "./entities/SuggestionPhoto";
import { TourGuide } from "./entities/TourGuide";
import { Accommodation } from "./entities/Accommodation";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "sua_senha_aqui",
  database: process.env.DB_NAME || "caminhos_leopoldina",
  synchronize: true,
  logging: true,
  entities: [
    User,
    Trail,
    UserCompletedTrail,
    Suggestion,
    SuggestionPhoto,
    TourGuide,
    Accommodation,
  ],
  migrations: [],
  subscribers: [],
});