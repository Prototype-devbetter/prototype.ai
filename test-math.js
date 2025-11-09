import { create, all } from "mathjs";

const math = create(all, {});

console.log("2 + 2 =", math.evaluate("2 + 2"));
console.log("sqrt(16) =", math.sqrt(16));
