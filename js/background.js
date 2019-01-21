
const baseURL = 'http://172.20.9.30'
var instance = axios.create({
  baseURL,
  timeout: 1000
});

async function request() {
  let sid = await getZenTaoSid()
  let url = '/zentao/my-bug-assignedTo.html'
  let res = await instance.get(url, {'headers': {'Cookie': `zentaosid=${sid}`}})
  if (checkIsNew(res.data)) {
    show()
  }
}
async function show() {
  var time = /(..)(:..)/.exec(new Date());     // The prettyprinted time.
  var hour = time[1] % 12 || 12;               // The prettyprinted hour.
  var period = time[1] < 12 ? 'a.m.' : 'p.m.'; // The period of the day.

  new Notification(hour + time[2] + ' ' + period, {
    icon: 'img/48.png',
    body: '您有新的bug，请及时修改'
  });
  
}
// 检查是否有新bug
function checkIsNew(res) {
  let zentaoRes = localStorage.ZENTAO_BUG_HTML
  if (!zentaoRes) {
    localStorage.ZENTAO_BUG_HTML = res
    return false
  }
  let localDomLength = getBugCount(zentaoRes)
  let resDomLength = getBugCount(res)
  
  localStorage.ZENTAO_BUG_HTML = res
  if(localDomLength < resDomLength) {
    return true
  } else {
    return false
  }
}
// 获取bug数
function getBugCount(htmlStr) {
  let tableStr = htmlStr.match(/bugList'>([\s\S]*?)(?=<\/table)/g)
  tableStr = tableStr[0]
  tableStr = "<table id='" + tableStr + "</table>"
  let localTable = document.createElement('div')
  localTable.innerHTML = tableStr
  let tableDom = localTable.getElementsByTagName('table')[0]
  let tfoot = tableDom.getElementsByTagName('tfoot')[0]
  let tr = tfoot.getElementsByTagName('tr')[0]
  let td = tr.getElementsByTagName('td')[0]
  let strong = td.getElementsByTagName('strong')[0]
  return (strong) ? Number(strong.innerHTML) : 0
}
async function getZenTaoSid() {
  const url = 'http://172.20.9.30/zentao/my-bug-assignedTo.html'
  let detail = {
    url,
    name: 'zentaosid'
  }
  let p = new Promise((rs, rj) => {
    chrome.cookies.get(detail, (cookie) => {
      if(cookie){
        rs(cookie.value)
      } else {
        rj(new Error('cookie is not found!'))
      }
    })
  })
  return p
}
// Conditionally initialize the options.
if (!localStorage.isInitialized) {
  localStorage.isActivated = true;   // The display activation.
  localStorage.frequency = 5;        // The display frequency, in minutes.
  localStorage.isInitialized = true; // The option initialization.
}

// Test for notification support.
if (window.Notification) {
  // While activated, show notifications at the display frequency.
  if (JSON.parse(localStorage.isActivated)) { request(); }

  var interval = 0; // The display interval, in minutes.

  setInterval(function() {
    interval++;

    if (
      JSON.parse(localStorage.isActivated) &&
        localStorage.frequency <= interval
    ) {
      request();
      interval = 0;
    }
  }, localStorage.frequency * 1000);
}
