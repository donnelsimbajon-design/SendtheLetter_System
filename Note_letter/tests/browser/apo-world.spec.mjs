import { test, expect } from '@playwright/test';
const writer={id:54,username:'apo-world-tester',email:'game@example.test',role:'user',isActive:true};
async function loginMock(page){
  await page.addInitScript(account=>{
    localStorage.setItem('token','apo-world-browser-test-token');
    localStorage.setItem('user',JSON.stringify(account));
  },writer);
  await page.route('**/api/**',route=>{
    const url=new URL(route.request().url());
    const body=url.pathname==='/api/auth/session'?{user:writer}:[];
    return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:JSON.stringify(body)});
  });
}
test('Apo Letter World is an authenticated module, not a public letter leak',async({page})=>{
  await page.goto('/world');
  await expect(page).toHaveURL(/\/login\?returnTo=/);
  await expect(page.getByRole('heading',{name:'Apo Letter World'})).toHaveCount(0);
});
test('a real WebGL 3D village loads with interactive controls and navigation',async({page})=>{
  await loginMock(page);
  await page.goto('/world');
  await expect(page.getByRole('heading',{name:'Apo Letter World'})).toBeVisible();
  const canvas=page.getByTestId('apo-world-canvas');
  await expect(canvas).toHaveAttribute('data-renderer','webgl',{timeout:15000});
  expect(await canvas.evaluate(el=>Boolean(el.getContext('webgl')))).toBe(true);
  await expect(page.getByRole('button',{name:'Walk forward'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Turn camera right'})).toBeVisible();
  // Coordinates remain in the DOM but hide visually on compact phones to preserve space.
  await expect(page.getByTestId('world-position')).toBeAttached();
  await expect(page.getByText('Real 3D solo game.',{exact:false})).toBeVisible();
});
test('keyboard movement updates actual coordinates and Post Office opens real letter editing',async({page})=>{
  await loginMock(page);await page.goto('/world');
  await expect(page.getByTestId('apo-world-canvas')).toHaveAttribute('data-renderer','webgl');
  const position=page.getByTestId('world-position');
  const before=await position.textContent();
  await page.keyboard.down('w');await page.waitForTimeout(650);await page.keyboard.up('w');
  await expect.poll(async()=>await position.textContent()).not.toBe(before);
  await page.getByRole('button',{name:'Explore places'}).click();
  await page.getByRole('button',{name:'Travel to Letter Post Office'}).click();
  await expect(page.getByRole('button',{name:'Interact with Letter Post Office'})).toBeVisible();
  await page.getByRole('button',{name:'Interact with Letter Post Office'}).click();
  await expect(page).toHaveURL(/\/dashboard\/notes\?compose=1/);
});
test('Alexis is an in-world NPC, not an AI chatbot',async({page})=>{
  await loginMock(page);await page.goto('/world');
  await expect(page.getByTestId('apo-world-canvas')).toHaveAttribute('data-renderer','webgl');
  await page.getByRole('button',{name:'Explore places'}).click();
  await page.getByRole('button',{name:'Travel to Alexis'}).click();
  await page.getByRole('button',{name:'Interact with Alexis'}).click();
  const dialog=page.getByRole('dialog',{name:'Talking to Alexis'});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Try WASD to walk',{exact:false})).toBeVisible();
  await dialog.getByRole('button',{name:'Explore the village'}).click();
  await expect(dialog).toHaveCount(0);
});
test('3D world fits mobile phones and contains touch controls',async({page})=>{
  await loginMock(page);await page.goto('/world');
  await expect(page.getByTestId('apo-world-canvas')).toHaveAttribute('data-renderer','webgl');
  for(const width of [320,390,768]){
    await page.setViewportSize({width,height:780});
    await expect(page.getByRole('button',{name:'Walk forward'})).toBeVisible();
    await expect(page.getByRole('button',{name:'Walk backward'})).toBeVisible();
    await expect(page.getByRole('button',{name:'Hold to run'})).toBeVisible();
    const fit=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,canvas:document.querySelector('[data-testid="apo-world-canvas"]')?.getBoundingClientRect().width}));
    expect(fit.scroll).toBeLessThanOrEqual(fit.client+2);
    expect(fit.canvas).toBeGreaterThan(width*.65);
  }
});
test('without WebGL the app explains the limitation rather than faking a 2D game',async({page})=>{
  await loginMock(page);
  await page.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){
      if(type==='webgl')return null;
      return original.call(this,type,...args);
    };
  });
  await page.goto('/world');
  await expect(page.getByTestId('world-unavailable')).toBeVisible();
  await expect(page.getByRole('link',{name:'Write a letter'})).toBeVisible();
});
