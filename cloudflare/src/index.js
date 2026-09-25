const KALSHI_URL="https://external-api.kalshi.com/trade-api/v2/markets?series_ticker=KXBTC15M&status=open&limit=1000";
const BTC_URL="https://api.coinbase.com/v2/prices/BTC-USD/spot";
const ALLOW_ORIGIN="*";

const headers={
  "access-control-allow-origin":ALLOW_ORIGIN,
  "access-control-allow-methods":"GET,HEAD,OPTIONS",
  "access-control-allow-headers":"Content-Type",
  "cache-control":"no-store",
  "content-type":"application/json; charset=UTF-8"
};

function num(v){
  const n=Number(v);
  return Number.isFinite(n)?n:null;
}
function normalize(raw){
  return (raw?.markets||[])
   .filter(m=>Date.parse(m?.close_time||m?.expected_expiration_time||"")>Date.now())
   .sort((a,b)=>Date.parse(a.close_time)-Date.parse(b.close_time))
   .slice(0,8)
   .map(m=>{
     const bid=num(m.yes_bid_dollars??m.yes_bid);
     const ask=num(m.yes_ask_dollars??m.yes_ask);
     const last=num(m.last_price_dollars??m.last_price);
     const yes=(bid!==null&&ask!==null)?(bid+ask)/2:(last!==null?last:null);
     const target=[m.floor_strike,m.floor_strike_dollars,m.functional_strike,m.custom_strike]
       .map(num).find(v=>v!==null);
     return {
       ticker:m.ticker||null,event_ticker:m.event_ticker||null,
       title:m.title||"BTC price up in next 15 mins?",
       close_time:m.close_time||m.expected_expiration_time||null,
       target,yes_bid:bid,yes_ask:ask,yes_probability:yes,last_price:last
     };
   });
}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(request.method==="OPTIONS") return new Response(null,{status:204,headers});
    if(url.pathname==="/api/live"){
      try{
        const [kr,br]=await Promise.all([
          fetch(KALSHI_URL,{headers:{"accept":"application/json"}}),
          fetch(BTC_URL,{headers:{"accept":"application/json"}})
        ]);
        if(!kr.ok) throw Error("Kalshi HTTP "+kr.status);
        if(!br.ok) throw Error("Coinbase HTTP "+br.status);
        const [kd,bd]=await Promise.all([kr.json(),br.json()]);
        const btc=num(bd?.data?.amount);
        const markets=normalize(kd);
        return new Response(JSON.stringify({
          generated_at:new Date().toISOString(),
          ok:markets.length>0 && btc!==null,
          source:"Cloudflare Worker -> Kalshi + Coinbase",
          series:"KXBTC15M",btc_spot:btc,markets,
          error:markets.length?"No":"No open KXBTC15M markets returned."
        }),{status:200,headers});
      }catch(e){
        return new Response(JSON.stringify({
          generated_at:new Date().toISOString(),ok:false,series:"KXBTC15M",
          btc_spot:null,markets:[],error:e?.message||String(e)
        }),{status:502,headers});
      }
    }
    if(env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("BTC Kalshi Tracker",{status:200,headers:{"content-type":"text/plain;charset=UTF-8"}});
  }
};