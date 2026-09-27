import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Trail } from "./entities/Trail";
import { UserCompletedTrail } from "./entities/UserCompletedTrail";
import { Suggestion } from "./entities/Suggestion";
import { SuggestionPhoto } from "./entities/SuggestionPhoto";

// Para deixar o projeto preparado para quando for hospedar o banco de dados em 
// plataformas na nuvem como o Render, configuramos a conexão usando variáveis de ambiente
// com um fallback seguro para o nosso ambiente local do Docker.
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5433"), // A porta 5433 que ajustamos no Docker!
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "sua_senha_aqui", // Use a mesma senha do docker-compose
  database: process.env.DB_NAME || "caminhos_leopoldina",
  
  // O synchronize true vai ler as suas 5 entities e criar as tabelas 
  // automaticamente no PostgreSQL assim que o servidor ligar.
  synchronize: true, 
  logging: true, // Deixei true para você ver o TypeORM gerando os "CREATE TABLE" no terminal
  
  entities: [User, Trail, UserCompletedTrail, Suggestion, SuggestionPhoto],
  migrations: [],
  subscribers: [],
});