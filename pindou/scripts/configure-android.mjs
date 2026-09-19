import fs from 'node:fs';

const manifest='android/app/src/main/AndroidManifest.xml';
if(fs.existsSync(manifest)){
  let s=fs.readFileSync(manifest,'utf8');
  if(!s.includes('android:largeHeap=')) s=s.replace('<application','<application android:largeHeap="true"');
  fs.writeFileSync(manifest,s);
}
