import json from "../assets/classification-result.json";
import { post } from "./utils";

// eslint-disable-next-line
post.bind("http://localhost:3000", json).then((r: any) => JSON.stringify(r)).then((r: any) => console.log(r));
