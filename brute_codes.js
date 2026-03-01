const crypto = require('crypto');

const hashesToReverse = {
    "16c19f683f2bed72c9a25991229e4e50f1b3d96f9b1fc80b33382a479510caf3": "Aanak Sengupta",
    "e237847e391e6e44f6eb7fadd938ba3fe7a87d2c053d308f50321efda0d56e89": "Abhishek Gosavi",
    "5149aee3c3df98af8d9ba89a9c5307d6e3e2c6fc58ac17a662c9ce958faff1bb": "Abhishek Mukharjee",
    "e49818748ddab1f7baa9fef3d427aef8475b7ea4976325ca67fd853e834c2ad1": "Adarsh",
    "12ae265fcfe315a363b94cb06b5634257af6517781d59af94fab6a618bf70f23": "Aiswarya Mahajan",
    "08a1e37dc877c30de1173adea983ee71b1290145f5d550442d5011a5ee81a0a9": "Akshat",
    "dbaee18f4c101c11915a4016b7ffe6f99a42cc8f03a363c1ef1be3e1288bb96e": "Aniket Chandra",
    "cc83219f2c8f948f5240247f7a5c8d183bf169561ad51deb844115fd88b57461": "Anubhav Gaba",
    "e1fe61beee15f9d5bc2feaca4499435a25dd849943154347ac6792f45c800904": "Ayush Borse",
    "6ae29c8266e042c990b22c648de06825fb83d9a2e854ca65b4fd30f692f5aedd": "Ayush Mittal",
    "28841371a08d25b56ef381edd2756e8dcc5792859c7a0c098b3b14d4e27ab43c": "Bharat Dhir",
    "41da006b592be6b5ed2fb9c68a90b5e814a17e3db88b7426f8df380b7d4997d8": "Devashish Rane",
    "09de61a7e56d04c645ef210ea2fb3ff695b54aef17178fa368a8539eae253ea5": "Gunjan Samtani",
    "f3872e0362c0142220ed2ba58fa2db5d8d0dc97c62e6c9590bb4bc1ad0227a57": "Harsh Bhimrajka",
    "5b72c4105fd456508703bcb7afd21e91d0a460aeb7f64e6860c59a1e57200ef5": "Iti Kathed",
    "29ac7e8d2098785c31fd9a833914c653c7ad4d509cbc12e722f36808dc0533ab": "Kartik Khandelwal",
    "a3b4a5118f8efabedce8f5a8c7b7b0e43a8b8fec3036433f7487f9ac682b4137": "Kovid Poudel",
    "082b86d1dabd04fc183939f3ff890a6406533b5638c62532859a292dc2daf49f": "Mammoth",
    "0b848d1b497a870ea4955a6cb8b822b7acf7f7c5f9d76f7947a5118f598917ca": "Manasi Chansoria",
    "edad83137663419431e8766e1340821ce169f22fd97656e9938c8e695148989b": "Mehul Mohan",
    "defa5bdec889f8f993407118f32d66710716c2ebfc356c4043e3aaecc0ad5e9e": "Mohnish Mhatre",
    "683f056e6d85b45b215d6e887c88d18f22e91721f8c909e743e331ce6bf5fca5": "Naisargi Kothari",
    "527245b31a4fa978be7e8846643dfab74d560c0f8518c8bc9097f2efe68c300d": "Neil Daftary",
    "9ad15eb8fcb50ef1c9c0e36867ce4a7dc9da60e3ded6726c11e5ec5fedd72201": "Padmanabhan Murli",
    "30877da7c4e2854dd13fbff01b226bf18494568e57d02159b901ef9ca7756553": "Pooja Ghatia",
    "a84f1cf7144d191155c0944fad66d7316d786cdad951cae1654704b0ca9d219d": "Prachi Verma",
    "15e7a100916541060e16055751255f31e525b2bc2efcedc3081955d8aa18193b": "Pranjal Srivastava",
    "088146b310463991f485be19a559f5ef697ae852c531941040b83939e9049d70": "Rahul",
    "26fb7f4e56b029bad1f1b76c6b4cc463f7c93326ca0804a9d6459bafd5cafbb3": "Ritvik Hedge",
    "e4fcaff58090b523c86454fa645f73bb8f49c3219aa0377ce91879e03e51f82c": "Sagar Badiyani",
    "9423cd565f20b859bee19068347486578acee20509353f089740efe8dbc6f97e": "Sajag Jain",
    "76dfc6b6f51d23bea85da821f6c6de61e5c310cca49fca1569e68bffc587238d": "Shaunak",
    "956dc6491ca6f89adfa0f8def2526647e80363f3f37451e557eacf2ef85f3775": "Shikhar Sharma",
    "b107b7745586dc0dfd37b683877fb717515c1a474075c228185da9287f38cb22": "Shrenik Golecha",
    "d46a257fccfc1335dc0eeaa9418033724e8db758f02b319ac88e943d141db5fd": "Shubh Khandelwal",
    "dcf3984fe5bb2e32a3785f3f0f6ef33cf5b899747433f1bf3b819745a8c770a5": "Shubham Jain",
    "d43365771f909c1f69971e67ddd5d61f075a86e74cf98d9b8c4b3e8e70631f52": "Siddak Bakshi",
    "0d1ee4097028b24b589a118ca2f6cde49f5a439cbd1673a77a900ccf9da8856a": "Srishti Malviya",
    "f83acfb22ce667a8d6f929a91c4f4dbba41f203f392fe1564565c3ceb3114b9a": "Swapnil",
    "39058eb57a49e1811bdabe76079b256d2917f49502e4ca49d266b2e0a88409e2": "Vaibhav Gupta",
    "829004072bde2d96a0cb6af5679b7c3e362f567f5e8e576cee7df183987add35": "Varun Chopra",
    "8dc38a0cca9518cd796e680fc0da38cdcdcffb4876e7f4010830dfef31bb0af6": "Vrishali",
    "d8d38814d35f257da890268581a51b3aaff07ee97c77cfe7aee5c18d3ad707f9": "Vishnupriya",
    "b84c0bc1614cfc05ce5c16c482bf07a0665d52ba7f5ec1a3e7cf46624ca52827": "Surabhi Solanki",
    "64806b2ee21fbe8b7f572c3137ad82a794d1a03edf16387e22a890a93197419e": "The Midnight Intern",
    "c6253ab7b57cfce41301e901a21c82bf28bfa7531dfbeaea6a229a3ad08dc349": "The IT Support"
};

const reversed = {};
const hashEntries = Object.entries(hashesToReverse);

for (let i = 10000; i <= 99999; i++) {
    const code = i.toString();
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    if (hashesToReverse[hash]) {
        reversed[hashesToReverse[hash]] = code;
    }
}

console.log(JSON.stringify(reversed, null, 2));
