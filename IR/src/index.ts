import app from "./app";
import { ExpressPort } from "./environment";

app.listen(ExpressPort, () => {
    // eslint-disable-next-line
    console.log("App listening at http://localhost:" + ExpressPort);
});