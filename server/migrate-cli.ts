import { runMigrations } from "./migrate";

runMigrations()
  .then(() => {
    console.log("Migrations OK");
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
