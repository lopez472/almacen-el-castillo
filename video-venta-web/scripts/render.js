const { chromium } = require('playwright');
const path=require('path'), fs=require('fs');
(async()=>{
  const [html,out,fps=30,only] = process.argv.slice(2);
  fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1080,height:1920}});
  await p.goto('file://'+path.resolve(html)); await p.waitForTimeout(300);
  const D=await p.evaluate(()=>window.DURATION);
  const times = only ? only.split(',').map(Number) : [...Array(Math.round(D*fps)).keys()].map(i=>i/fps);
  for(let i=0;i<times.length;i++){
    await p.evaluate(t=>render(t),times[i]);
    await p.screenshot({path:`${out}/f${String(i).padStart(5,'0')}.jpg`,type:'jpeg',quality:92});
  }
  await b.close();
})();
