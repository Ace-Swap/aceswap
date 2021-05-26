  
const fs = require("fs");

for (const contract of fs.readdirSync("./build")) {
    const path = "./build/" + contract;
    const json = JSON.parse(fs.readFileSync(path).toString());
    fs.writeFileSync(path, JSON.stringify({
        abi: json.abi,
        bytecode: json.bytecode
    }, null, 2));
}
