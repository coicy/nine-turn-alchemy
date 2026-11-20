/* Stable line IDs and a small graph; dialogue cannot grant money or materials. */
(() => {
  'use strict';
  const strings={
    opening_room:'旧丹炉已经安置妥当，火门里的炉火轻轻跳动。这间临街的小丹房，今日开张。',
    opening_lease:'你想起邵四娘交铺契时的叮嘱：“铺钱七日一结，头回四十文，往后一百二十文。手头再紧，也得留些周转的钱。”',
    opening_customer:'{{request}}条件写在纸笺上，劳烦掌柜先看清。',
    opening_terms:'条件我看过了。这单我接，您候着便是。',
    opening_fire:'你在炉前站定。炉盖尚合着，火门透着红光。开张后的第一炉，就从这里起手。',
    opening_collect:'铺租要按时交，来客的嘱托也不能轻慢。先把这第一炉守稳。',
    opening_question:'若是炼坏了，药材如何算？',
    opening_answer:'炼坏了不必赔药。若炼成合用的丹，照纸笺上的要求交来，工钱照付。',
    opt_continue:'继续',opt_meet:'去柜台迎客',opt_terms:'先核对委托',opt_risk:'问清约定',opt_fire:'携料回炉',opt_begin:'亲手开炉',
    visitor_greeting:'{{greeting}}',visitor_intro:'我是{{visitor}}，做的是{{role}}的营生。{{request}}',
    visitor_terms:'药材{{materials}}包，都是{{nature}}的。丹药得有{{target}}药力，工钱{{fee}}文，纸笺上也写明白了。',
    visitor_active:'我在柜边候着。掌柜先照看炉里的丹，不必为了说话耽误守炉。',
    visitor_talk:'{{smalltalk}}',visitor_market:'坊市的药材、炉具和法器各有用途。先看清货物和价钱，留足铺租，再决定添置什么。',
    visitor_end:'那就劳烦掌柜了。纸笺留在柜上，随时可以再看。',
    opt_intro:'初次见面，怎么称呼？',opt_chat:'聊聊近况',opt_market:'问问坊市',opt_market_locked:'第二日开门后可聊',opt_letter:'打开原委托纸笺',opt_back:'还有一事',opt_goodbye:'先去忙了',opt_close:'结束交谈',
    visitor_return:'掌柜，我们又见面了。这回还是先把手头这一单说清楚。',
    commission_notice:'掌柜，我有一份代炼委托，详情都在这张纸笺上。',
    opt_read_commission:'查看委托'
  };
  const graphs={
    commission:{id:'commission',version:1,title:'来客委托',start:'notice',kind:'commission',nodes:{
      notice:{speaker:'visitor',line:'commission_notice',scene:'orders',next:'letter',nextText:'opt_read_commission'},
      letter:{end:true,action:'letter'}
    }},
    opening:{id:'opening',version:4,title:'丹坊开张',start:'room',kind:'opening',legacySteps:['room','arrival','fire'],nodes:{
      room:{stage:0,workMode:'room',shot:'room',speaker:'narrator',line:'opening_room',scene:'work',next:'lease'},
      lease:{stage:0,workMode:'room',shot:'room',speaker:'narrator',line:'opening_lease',scene:'work',next:'arrival',nextText:'opt_meet'},
      arrival:{stage:1,shot:'customer',speaker:'visitor',line:'commission_notice',scene:'orders',next:'question',nextText:'opt_risk'},
      question:{stage:1,shot:'customer',speaker:'player',line:'opening_question',scene:'orders',next:'answer'},
      answer:{stage:1,shot:'customer',speaker:'visitor',line:'opening_answer',scene:'orders',next:'terms',nextText:'opt_terms'},
      terms:{stage:1,shot:'customer',speaker:'player',line:'opening_terms',scene:'orders',facts:true,set:{'read_terms':true},next:'fire',nextText:'opt_fire'},
      fire:{stage:2,workMode:'furnace',shot:'furnace',speaker:'narrator',line:'opening_fire',scene:'work',next:'collect'},
      collect:{stage:2,workMode:'furnace',shot:'furnace',speaker:'narrator',line:'opening_collect',scene:'work',next:'end',nextText:'opt_begin'},
      end:{end:true,set:{openingComplete:true}}
    }},
    visitor:{id:'visitor',version:1,title:'柜前交谈',start:'greeting',kind:'visitor',nodes:{
      greeting:{speaker:'visitor',line:'visitor_greeting',scene:'orders',choices:[
        {id:'intro',text:'opt_intro',to:'intro',if:{source:'flag',key:'met.{{customerId}}',op:'ne',value:true}},
        {id:'terms',text:'opt_terms',to:'terms'},
        {id:'chat',text:'opt_chat',to:'chat'},
        {id:'market',text:'opt_market',to:'market',if:{source:'context',key:'day',op:'gte',value:2},lockedText:'opt_market_locked'},
        {id:'bye',text:'opt_goodbye',to:'goodbye'}]},
      intro:{speaker:'visitor',line:'visitor_intro',set:{'met.{{customerId}}':true},next:'greeting'},
      terms:{speaker:'visitor',line:'visitor_terms',facts:true,set:{read_terms:true},choices:[{id:'letter',text:'opt_letter',to:'letter'},{id:'back',text:'opt_back',to:'greeting'}]},
      chat:{speaker:'visitor',line:'visitor_talk',set:{'met.{{customerId}}':true},next:'greeting'},
      market:{speaker:'visitor',line:'visitor_market',next:'greeting'},
      goodbye:{speaker:'visitor',line:'visitor_end',next:'end',nextText:'opt_close'},
      letter:{end:true,action:'letter',set:{'met.{{customerId}}':true}},
      end:{end:true,set:{'met.{{customerId}}':true}}
    }}
  };
  window.AlchemyDialogueContent={locale:'zh-CN',strings:{'zh-CN':strings},graphs,speakers:{narrator:{name:'旁白',seal:'叙'},landlady:{name:'邵四娘',role:'铺契交接',seal:'邵'},player:{name:'你',role:'丹坊掌柜',seal:'掌'},visitor:{name:'{{visitor}}',role:'{{role}}',seal:'客'}}};
})();
