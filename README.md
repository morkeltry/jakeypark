```
npm i -g snarkjs
cd zkverify
npm i

snarkjs powersoftau new bn128 18 pot18_0000.ptau -v
snarkjs powersoftau contribute pot18_0000.ptau pot18_final.ptau --name="Brucey Battle" -v

cd circom

circom example.circom --r1cs --wasm --sym -l ../node_modules/circomlib/circuits -o build

snarkjs groth16 setup build/example.r1cs pot18_final.ptau build/example.zkey
snarkjs zkey export verificationkey  build/example.zkey vkey.json

node build/example_js/generate_witness.js build/example_js/example.wasm ../inputs4.json witness.wtns
snarkjs wtns export json witness.wtns witness.json


cd ..
node verifyWithRelayer.mjs

```


