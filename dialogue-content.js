/* Stable line IDs and a small graph; dialogue cannot grant money or materials. */
(() => {
  'use strict';
  const strings={
    opening_room:'你把旧丹炉安放在临街的小屋。炉火点起，门外的新招牌也挂好了。',
    opening_lease:'铺钱七日一结。头回四十文，往后一百二十文，都写在铺契上。守炉归守炉，也别忘了留些周转的钱。',
    opening_customer:'{{request}}条件写在纸笺上，劳烦掌柜先看清。',
    opening_terms:'药材、所求药力和工钱都对上了。这一单我接下了。',
    opening_fire:'{{materials}}包客料已经备好。点丹炉进入炉前，再取一包投入炉口，便能开始催炼。',
    opening_collect:'火候由你把握。想收手时，先将成丹收入丹匣；满足委托要求后，再回柜台提交。委托纸笺随时可以查看。',
    opening_question:'若这一炉没能炼成，该怎么办？',
    opening_answer:'未成丹不必赔药。别把“收丹入匣”和“提交委托”混在一起：先收好，再按这一单的要求交付。',
    opt_continue:'继续',opt_meet:'去柜台迎客',opt_terms:'先核对委托',opt_risk:'问清交付与失败',opt_fire:'携料回炉',opt_begin:'亲手开炉',
    visitor_greeting:'{{greeting}}',visitor_intro:'我是{{visitor}}，做的是{{role}}的营生。{{request}}',
    visitor_terms:'这张纸笺对应{{materials}}包{{nature}}药材，所求药力{{target}}，约定工钱{{fee}}文。最终交付和工钱，以原委托纸笺及实际提交为准。',
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
    opening:{id:'opening',version:2,title:'丹坊开张',start:'room',kind:'opening',legacySteps:['room','arrival','fire'],nodes:{
      room:{stage:0,speaker:'narrator',line:'opening_room',scene:'work',next:'lease'},
      lease:{stage:0,speaker:'landlady',line:'opening_lease',scene:'work',next:'arrival',nextText:'opt_meet'},
      arrival:{stage:1,speaker:'visitor',line:'commission_notice',scene:'orders',next:'terms',nextText:'opt_terms'},
      question:{stage:1,speaker:'player',line:'opening_question',scene:'orders',next:'answer'},
      answer:{stage:1,speaker:'visitor',line:'opening_answer',scene:'orders',next:'fire',nextText:'opt_fire'},
      terms:{stage:1,speaker:'player',line:'opening_terms',scene:'orders',facts:true,set:{'read_terms':true},next:'question'},
      fire:{stage:2,speaker:'narrator',line:'opening_fire',scene:'work',next:'collect'},
      collect:{stage:2,speaker:'narrator',line:'opening_collect',scene:'work',next:'end',nextText:'opt_begin'},
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
