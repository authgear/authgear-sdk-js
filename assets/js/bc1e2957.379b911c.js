"use strict";(self.webpackChunksite=self.webpackChunksite||[]).push([[5108],{3905:function(e,n,t){t.d(n,{Zo:function(){return d},kt:function(){return k}});var a=t(7294);function i(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function r(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);n&&(a=a.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,a)}return t}function o(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?r(Object(t),!0).forEach((function(n){i(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):r(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function l(e,n){if(null==e)return{};var t,a,i=function(e,n){if(null==e)return{};var t,a,i={},r=Object.keys(e);for(a=0;a<r.length;a++)t=r[a],n.indexOf(t)>=0||(i[t]=e[t]);return i}(e,n);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(a=0;a<r.length;a++)t=r[a],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(i[t]=e[t])}return i}var s=a.createContext({}),u=function(e){var n=a.useContext(s),t=n;return e&&(t="function"==typeof e?e(n):o(o({},n),e)),t},d=function(e){var n=u(e.components);return a.createElement(s.Provider,{value:n},e.children)},c={inlineCode:"code",wrapper:function(e){var n=e.children;return a.createElement(a.Fragment,{},n)}},p=a.forwardRef((function(e,n){var t=e.components,i=e.mdxType,r=e.originalType,s=e.parentName,d=l(e,["components","mdxType","originalType","parentName"]),p=u(t),k=i,m=p["".concat(s,".").concat(k)]||p[k]||c[k]||r;return t?a.createElement(m,o(o({ref:n},d),{},{components:t})):a.createElement(m,o({ref:n},d))}));function k(e,n){var t=arguments,i=n&&n.mdxType;if("string"==typeof e||i){var r=t.length,o=new Array(r);o[0]=p;var l={};for(var s in n)hasOwnProperty.call(n,s)&&(l[s]=n[s]);l.originalType=e,l.mdxType="string"==typeof e?e:i,o[1]=l;for(var u=2;u<r;u++)o[u]=t[u];return a.createElement.apply(null,o)}return a.createElement.apply(null,t)}p.displayName="MDXCreateElement"},4080:function(e,n,t){t.r(n),t.d(n,{assets:function(){return d},contentTitle:function(){return s},default:function(){return k},frontMatter:function(){return l},metadata:function(){return u},toc:function(){return c}});var a=t(3117),i=t(102),r=(t(7294),t(3905)),o=["components"],l={},s=void 0,u={unversionedId:"react-native/enums/SessionStateChangeReason",id:"react-native/enums/SessionStateChangeReason",title:"SessionStateChangeReason",description:"@authgear/react-native / SessionStateChangeReason",source:"@site/docs/react-native/enums/SessionStateChangeReason.md",sourceDirName:"react-native/enums",slug:"/react-native/enums/SessionStateChangeReason",permalink:"/authgear-sdk-js/docs/react-native/enums/SessionStateChangeReason",draft:!1,editUrl:"https://github.com/authgear/authgear-sdk-js/edit/master/website/docs/react-native/enums/SessionStateChangeReason.md",tags:[],version:"current",frontMatter:{},sidebar:"root",previous:{title:"SessionState",permalink:"/authgear-sdk-js/docs/react-native/enums/SessionState"},next:{title:"Introduction",permalink:"/authgear-sdk-js/docs/capacitor"}},d={},c=[{value:"Table of contents",id:"table-of-contents",level:2},{value:"Enumeration Members",id:"enumeration-members",level:3},{value:"Enumeration Members",id:"enumeration-members-1",level:2},{value:'<a id="authenticated" name="authenticated"></a> Authenticated',id:"-authenticated",level:3},{value:"Defined in",id:"defined-in",level:4},{value:'<a id="clear" name="clear"></a> Clear',id:"-clear",level:3},{value:"Defined in",id:"defined-in-1",level:4},{value:'<a id="foundtoken" name="foundtoken"></a> FoundToken',id:"-foundtoken",level:3},{value:"Defined in",id:"defined-in-2",level:4},{value:'<a id="invalid" name="invalid"></a> Invalid',id:"-invalid",level:3},{value:"Defined in",id:"defined-in-3",level:4},{value:'<a id="logout" name="logout"></a> Logout',id:"-logout",level:3},{value:"Defined in",id:"defined-in-4",level:4},{value:'<a id="notoken" name="notoken"></a> NoToken',id:"-notoken",level:3},{value:"Defined in",id:"defined-in-5",level:4}],p={toc:c};function k(e){var n=e.components,t=(0,i.Z)(e,o);return(0,r.kt)("wrapper",(0,a.Z)({},p,t,{components:n,mdxType:"MDXLayout"}),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/react-native"},"@authgear/react-native")," / SessionStateChangeReason"),(0,r.kt)("h1",{id:"enumeration-sessionstatechangereason"},"Enumeration: SessionStateChangeReason"),(0,r.kt)("p",null,"The reason why SessionState is changed."),(0,r.kt)("p",null,"These reasons can be thought of as the transition of a SessionState, which is described as follows:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"                                                         LOGOUT / INVALID\n                                          +----------------------------------------------+\n                                          v                                              |\n   State: UNKNOWN ----- NO_TOKEN ----\x3e State: NO_SESSION ---- AUTHENTICATED -----\x3e State: AUTHENTICATED\n     |                                                                                ^\n     +--------------------------------------------------------------------------------+\n                                        FOUND_TOKEN\n")),(0,r.kt)("h2",{id:"table-of-contents"},"Table of contents"),(0,r.kt)("h3",{id:"enumeration-members"},"Enumeration Members"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/react-native/enums/SessionStateChangeReason#authenticated"},"Authenticated")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/react-native/enums/SessionStateChangeReason#clear"},"Clear")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/react-native/enums/SessionStateChangeReason#foundtoken"},"FoundToken")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/react-native/enums/SessionStateChangeReason#invalid"},"Invalid")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/react-native/enums/SessionStateChangeReason#logout"},"Logout")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/react-native/enums/SessionStateChangeReason#notoken"},"NoToken"))),(0,r.kt)("h2",{id:"enumeration-members-1"},"Enumeration Members"),(0,r.kt)("h3",{id:"-authenticated"},(0,r.kt)("a",{id:"authenticated",name:"authenticated"})," Authenticated"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("strong",{parentName:"p"},"Authenticated")," = ",(0,r.kt)("inlineCode",{parentName:"p"},'"AUTHENTICATED"')),(0,r.kt)("h4",{id:"defined-in"},"Defined in"),(0,r.kt)("p",null,"packages/authgear-react-native/index.d.ts:172"),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"-clear"},(0,r.kt)("a",{id:"clear",name:"clear"})," Clear"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("strong",{parentName:"p"},"Clear")," = ",(0,r.kt)("inlineCode",{parentName:"p"},'"CLEAR"')),(0,r.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,r.kt)("p",null,"packages/authgear-react-native/index.d.ts:175"),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"-foundtoken"},(0,r.kt)("a",{id:"foundtoken",name:"foundtoken"})," FoundToken"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("strong",{parentName:"p"},"FoundToken")," = ",(0,r.kt)("inlineCode",{parentName:"p"},'"FOUND_TOKEN"')),(0,r.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,r.kt)("p",null,"packages/authgear-react-native/index.d.ts:171"),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"-invalid"},(0,r.kt)("a",{id:"invalid",name:"invalid"})," Invalid"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("strong",{parentName:"p"},"Invalid")," = ",(0,r.kt)("inlineCode",{parentName:"p"},'"INVALID"')),(0,r.kt)("h4",{id:"defined-in-3"},"Defined in"),(0,r.kt)("p",null,"packages/authgear-react-native/index.d.ts:174"),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"-logout"},(0,r.kt)("a",{id:"logout",name:"logout"})," Logout"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("strong",{parentName:"p"},"Logout")," = ",(0,r.kt)("inlineCode",{parentName:"p"},'"LOGOUT"')),(0,r.kt)("h4",{id:"defined-in-4"},"Defined in"),(0,r.kt)("p",null,"packages/authgear-react-native/index.d.ts:173"),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"-notoken"},(0,r.kt)("a",{id:"notoken",name:"notoken"})," NoToken"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("strong",{parentName:"p"},"NoToken")," = ",(0,r.kt)("inlineCode",{parentName:"p"},'"NO_TOKEN"')),(0,r.kt)("h4",{id:"defined-in-5"},"Defined in"),(0,r.kt)("p",null,"packages/authgear-react-native/index.d.ts:170"))}k.isMDXComponent=!0}}]);