/* eslint-disable no-unreachable */
/* eslint-disable arrow-parens */
/* eslint-disable no-unused-vars */
/* eslint-disable array-bracket-spacing */
/* eslint-disable no-undef */
'use strict';

const Controller = require('egg').Controller;
// const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer-core');
const https = require('https');
const qs = require('querystring');

const tdClassName = ['c-project', 'c-name', 'c-user', 'c-status'];

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    const query = this.ctx.query;
    const { name = 'chenyucheng', pwd = 'hiseas.123', date = fun_date(-7) } = query;
    try {
      const data = await getCDData({ name, pwd });
      const resData = data.filter((_) => _['6'] >= date);
      ctx.status = 200;
      ctx.body = resData;
    } catch (error) {
      console.log('error :>> ', error);
      ctx.body = 'get candao data Error';
      ctx.status = 502;
      return false;
    }
  }
  async index2() {
    const { ctx } = this;
    ctx.status = 200;
    ctx.body = 'server is run';
  }
}

function fun_date(num) {
  const date1 = new Date();
  const date2 = new Date(date1);
  // num是正数表示之后的时间，num负数表示之前的时间，0表示今天
  date2.setDate(date1.getDate() + num);
  const m = Number(new Date().getMonth() + 1);
  const m2 = m >= 10 ? m : '0' + m;
  const day = date2.getDate();
  const day2 = date2.getDate() >= 10 ? day : '0' + day;
  const time2 = date2.getFullYear() + '-' + m2 + '-' + day2;
  return time2;
}
async function getCDData({ name, pwd }) {
  const pathExt = '/usr/bin/chromium-browser';

  const browser = await puppeteer.launch({ headless: true, executablePath: pathExt, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  //   const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1300, height: 500 });
  await page.goto('http://192.168.0.24/index.php?m=user&f=login');

  await page.waitFor(1000);

  await page.type('#account', name);
  await page.type('[name="password"]', pwd);
  await page.click('#submit');

  // 页面登录成功后，需要保证redirect 跳转到请求的页面
  await page.waitForNavigation();
  await page.goto('http://192.168.0.24/index.php?m=my&f=task');

  await page.waitFor(1000);

  await page.click('.pager-size-menu .dropdown-toggle');
  await page.waitFor(1000);
  await page.click('.pager-size-menu ul li:nth-child(11)');

  await page.waitFor(1000);

  const result = await page.evaluate((tdClassName) => {
    const itemList = document.querySelectorAll('#tasktable > tbody >tr');
    const writeDataList = trData(itemList);
    function trData(TRS) {
      const data = [];
      for (let i = 0; i < TRS.length; i++) {
        const TDS = TRS[i].children;
        data.push(tDData(TDS));
      }
      return data;
    }
    function tDData(TDS) {
      let TDSData = {};
      for (let i = 0; i < TDS.length; i++) {
        const className = TDS[i].className;
        if (tdClassName.includes(className) || className === '') {
          if (className === '') {
            TDSData = { ...TDSData, [i]: TDS[i].innerText };
          } else {
            TDSData = { ...TDSData, [className]: TDS[i].innerText };
          }
        }
      }
      return TDSData;
    }
    return Promise.resolve(writeDataList);
  }, tdClassName);
  await page.waitFor(1000);
  await browser.close();
  return result;
}

module.exports = HomeController;
