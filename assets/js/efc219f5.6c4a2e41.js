"use strict";(self.webpackChunksite=self.webpackChunksite||[]).push([[9028],{5304:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>r,contentTitle:()=>d,default:()=>c,frontMatter:()=>t,metadata:()=>o,toc:()=>l});var i=s(4848),a=s(8453);const t={},d="Enumeration: SessionStateChangeReason",o={id:"web/enums/SessionStateChangeReason",title:"SessionStateChangeReason",description:"@authgear/web / SessionStateChangeReason",source:"@site/docs/web/enums/SessionStateChangeReason.md",sourceDirName:"web/enums",slug:"/web/enums/SessionStateChangeReason",permalink:"/authgear-sdk-js/docs/web/enums/SessionStateChangeReason",draft:!1,unlisted:!1,editUrl:"https://github.com/authgear/authgear-sdk-js/edit/master/website/docs/web/enums/SessionStateChangeReason.md",tags:[],version:"current",frontMatter:{},sidebar:"root",previous:{title:"SessionState",permalink:"/authgear-sdk-js/docs/web/enums/SessionState"},next:{title:"SettingsAction",permalink:"/authgear-sdk-js/docs/web/enums/SettingsAction"}},r={},l=[{value:"Table of contents",id:"table-of-contents",level:2},{value:"Enumeration Members",id:"enumeration-members",level:3},{value:"Enumeration Members",id:"enumeration-members-1",level:2},{value:"<a></a> Authenticated",id:"-authenticated",level:3},{value:"Defined in",id:"defined-in",level:4},{value:"<a></a> Clear",id:"-clear",level:3},{value:"Defined in",id:"defined-in-1",level:4},{value:"<a></a> FoundToken",id:"-foundtoken",level:3},{value:"Defined in",id:"defined-in-2",level:4},{value:"<a></a> Invalid",id:"-invalid",level:3},{value:"Defined in",id:"defined-in-3",level:4},{value:"<a></a> Logout",id:"-logout",level:3},{value:"Defined in",id:"defined-in-4",level:4},{value:"<a></a> NoToken",id:"-notoken",level:3},{value:"Defined in",id:"defined-in-5",level:4}];function h(e){const n={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",h4:"h4",header:"header",hr:"hr",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,a.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.a,{href:"/authgear-sdk-js/docs/web",children:"@authgear/web"})," / SessionStateChangeReason"]}),"\n",(0,i.jsx)(n.header,{children:(0,i.jsx)(n.h1,{id:"enumeration-sessionstatechangereason",children:"Enumeration: SessionStateChangeReason"})}),"\n",(0,i.jsx)(n.p,{children:"The reason why SessionState is changed."}),"\n",(0,i.jsx)(n.p,{children:"These reasons can be thought of as the transition of a SessionState, which is described as follows:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"                                                     LOGOUT / INVALID / CLEAR\r\n                                          +----------------------------------------------+\r\n                                          v                                              |\r\n   State: UNKNOWN ----- NO_TOKEN ----\x3e State: NO_SESSION ---- AUTHENTICATED -----\x3e State: AUTHENTICATED\r\n     |                                                                                ^\r\n     +--------------------------------------------------------------------------------+\r\n                                        FOUND_TOKEN\n"})}),"\n",(0,i.jsx)(n.h2,{id:"table-of-contents",children:"Table of contents"}),"\n",(0,i.jsx)(n.h3,{id:"enumeration-members",children:"Enumeration Members"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.a,{href:"/authgear-sdk-js/docs/web/enums/SessionStateChangeReason#authenticated",children:"Authenticated"})}),"\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.a,{href:"/authgear-sdk-js/docs/web/enums/SessionStateChangeReason#clear",children:"Clear"})}),"\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.a,{href:"/authgear-sdk-js/docs/web/enums/SessionStateChangeReason#foundtoken",children:"FoundToken"})}),"\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.a,{href:"/authgear-sdk-js/docs/web/enums/SessionStateChangeReason#invalid",children:"Invalid"})}),"\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.a,{href:"/authgear-sdk-js/docs/web/enums/SessionStateChangeReason#logout",children:"Logout"})}),"\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.a,{href:"/authgear-sdk-js/docs/web/enums/SessionStateChangeReason#notoken",children:"NoToken"})}),"\n"]}),"\n",(0,i.jsx)(n.h2,{id:"enumeration-members-1",children:"Enumeration Members"}),"\n",(0,i.jsxs)(n.h3,{id:"-authenticated",children:[(0,i.jsx)("a",{id:"authenticated",name:"authenticated"})," Authenticated"]}),"\n",(0,i.jsxs)(n.p,{children:["\u2022 ",(0,i.jsx)(n.strong,{children:"Authenticated"})," = ",(0,i.jsx)(n.code,{children:'"AUTHENTICATED"'})]}),"\n",(0,i.jsx)(n.h4,{id:"defined-in",children:"Defined in"}),"\n",(0,i.jsx)(n.p,{children:"packages/authgear-web/index.d.ts:270"}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsxs)(n.h3,{id:"-clear",children:[(0,i.jsx)("a",{id:"clear",name:"clear"})," Clear"]}),"\n",(0,i.jsxs)(n.p,{children:["\u2022 ",(0,i.jsx)(n.strong,{children:"Clear"})," = ",(0,i.jsx)(n.code,{children:'"CLEAR"'})]}),"\n",(0,i.jsx)(n.h4,{id:"defined-in-1",children:"Defined in"}),"\n",(0,i.jsx)(n.p,{children:"packages/authgear-web/index.d.ts:273"}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsxs)(n.h3,{id:"-foundtoken",children:[(0,i.jsx)("a",{id:"foundtoken",name:"foundtoken"})," FoundToken"]}),"\n",(0,i.jsxs)(n.p,{children:["\u2022 ",(0,i.jsx)(n.strong,{children:"FoundToken"})," = ",(0,i.jsx)(n.code,{children:'"FOUND_TOKEN"'})]}),"\n",(0,i.jsx)(n.h4,{id:"defined-in-2",children:"Defined in"}),"\n",(0,i.jsx)(n.p,{children:"packages/authgear-web/index.d.ts:269"}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsxs)(n.h3,{id:"-invalid",children:[(0,i.jsx)("a",{id:"invalid",name:"invalid"})," Invalid"]}),"\n",(0,i.jsxs)(n.p,{children:["\u2022 ",(0,i.jsx)(n.strong,{children:"Invalid"})," = ",(0,i.jsx)(n.code,{children:'"INVALID"'})]}),"\n",(0,i.jsx)(n.h4,{id:"defined-in-3",children:"Defined in"}),"\n",(0,i.jsx)(n.p,{children:"packages/authgear-web/index.d.ts:272"}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsxs)(n.h3,{id:"-logout",children:[(0,i.jsx)("a",{id:"logout",name:"logout"})," Logout"]}),"\n",(0,i.jsxs)(n.p,{children:["\u2022 ",(0,i.jsx)(n.strong,{children:"Logout"})," = ",(0,i.jsx)(n.code,{children:'"LOGOUT"'})]}),"\n",(0,i.jsx)(n.h4,{id:"defined-in-4",children:"Defined in"}),"\n",(0,i.jsx)(n.p,{children:"packages/authgear-web/index.d.ts:271"}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsxs)(n.h3,{id:"-notoken",children:[(0,i.jsx)("a",{id:"notoken",name:"notoken"})," NoToken"]}),"\n",(0,i.jsxs)(n.p,{children:["\u2022 ",(0,i.jsx)(n.strong,{children:"NoToken"})," = ",(0,i.jsx)(n.code,{children:'"NO_TOKEN"'})]}),"\n",(0,i.jsx)(n.h4,{id:"defined-in-5",children:"Defined in"}),"\n",(0,i.jsx)(n.p,{children:"packages/authgear-web/index.d.ts:268"})]})}function c(e={}){const{wrapper:n}={...(0,a.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(h,{...e})}):h(e)}},8453:(e,n,s)=>{s.d(n,{R:()=>d,x:()=>o});var i=s(6540);const a={},t=i.createContext(a);function d(e){const n=i.useContext(t);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function o(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:d(e.components),i.createElement(t.Provider,{value:n},e.children)}}}]);