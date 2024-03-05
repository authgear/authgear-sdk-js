"use strict";(self.webpackChunksite=self.webpackChunksite||[]).push([[7384],{3905:function(e,t,r){r.d(t,{Zo:function(){return d},kt:function(){return u}});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function o(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function s(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?o(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function i(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},o=Object.keys(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var l=n.createContext({}),p=function(e){var t=n.useContext(l),r=t;return e&&(r="function"==typeof e?e(t):s(s({},t),e)),r},d=function(e){var t=p(e.components);return n.createElement(l.Provider,{value:t},e.children)},k={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},c=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,o=e.originalType,l=e.parentName,d=i(e,["components","mdxType","originalType","parentName"]),c=p(r),u=a,m=c["".concat(l,".").concat(u)]||c[u]||k[u]||o;return r?n.createElement(m,s(s({ref:t},d),{},{components:r})):n.createElement(m,s({ref:t},d))}));function u(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=r.length,s=new Array(o);s[0]=c;var i={};for(var l in t)hasOwnProperty.call(t,l)&&(i[l]=t[l]);i.originalType=e,i.mdxType="string"==typeof e?e:a,s[1]=i;for(var p=2;p<o;p++)s[p]=r[p];return n.createElement.apply(null,s)}return n.createElement.apply(null,r)}c.displayName="MDXCreateElement"},8019:function(e,t,r){r.r(t),r.d(t,{assets:function(){return d},contentTitle:function(){return l},default:function(){return u},frontMatter:function(){return i},metadata:function(){return p},toc:function(){return k}});var n=r(3117),a=r(102),o=(r(7294),r(3905)),s=["components"],i={},l=void 0,p={unversionedId:"capacitor/classes/PersistentTokenStorage",id:"capacitor/classes/PersistentTokenStorage",title:"PersistentTokenStorage",description:"@authgear/capacitor / PersistentTokenStorage",source:"@site/docs/capacitor/classes/PersistentTokenStorage.md",sourceDirName:"capacitor/classes",slug:"/capacitor/classes/PersistentTokenStorage",permalink:"/authgear-sdk-js/docs/capacitor/classes/PersistentTokenStorage",draft:!1,editUrl:"https://github.com/authgear/authgear-sdk-js/edit/master/website/docs/capacitor/classes/PersistentTokenStorage.md",tags:[],version:"current",frontMatter:{},sidebar:"root",previous:{title:"OAuthError",permalink:"/authgear-sdk-js/docs/capacitor/classes/OAuthError"},next:{title:"ServerError",permalink:"/authgear-sdk-js/docs/capacitor/classes/ServerError"}},d={},k=[{value:"Implements",id:"implements",level:2},{value:"Table of contents",id:"table-of-contents",level:2},{value:"Constructors",id:"constructors",level:3},{value:"Methods",id:"methods",level:3},{value:"Constructors",id:"constructors-1",level:2},{value:'<a id="constructor" name="constructor"></a> constructor',id:"-constructor",level:3},{value:"Defined in",id:"defined-in",level:4},{value:"Methods",id:"methods-1",level:2},{value:'<a id="delrefreshtoken" name="delrefreshtoken"></a> delRefreshToken',id:"-delrefreshtoken",level:3},{value:"Parameters",id:"parameters",level:4},{value:"Returns",id:"returns",level:4},{value:"Implementation of",id:"implementation-of",level:4},{value:"Defined in",id:"defined-in-1",level:4},{value:'<a id="getrefreshtoken" name="getrefreshtoken"></a> getRefreshToken',id:"-getrefreshtoken",level:3},{value:"Parameters",id:"parameters-1",level:4},{value:"Returns",id:"returns-1",level:4},{value:"Implementation of",id:"implementation-of-1",level:4},{value:"Defined in",id:"defined-in-2",level:4},{value:'<a id="setrefreshtoken" name="setrefreshtoken"></a> setRefreshToken',id:"-setrefreshtoken",level:3},{value:"Parameters",id:"parameters-2",level:4},{value:"Returns",id:"returns-2",level:4},{value:"Implementation of",id:"implementation-of-2",level:4},{value:"Defined in",id:"defined-in-3",level:4}],c={toc:k};function u(e){var t=e.components,r=(0,a.Z)(e,s);return(0,o.kt)("wrapper",(0,n.Z)({},c,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/capacitor"},"@authgear/capacitor")," / PersistentTokenStorage"),(0,o.kt)("h1",{id:"class-persistenttokenstorage"},"Class: PersistentTokenStorage"),(0,o.kt)("p",null,"PersistentTokenStorage stores the refresh token in a persistent storage.\nWhen the app launches again next time, the refresh token is loaded from the persistent storage.\nThe user is considered authenticated as long as the refresh token is found.\nHowever, the validity of the refresh token is not guaranteed.\nYou must call fetchUserInfo to ensure the refresh token is still valid."),(0,o.kt)("h2",{id:"implements"},"Implements"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/capacitor/interfaces/TokenStorage"},(0,o.kt)("inlineCode",{parentName:"a"},"TokenStorage")))),(0,o.kt)("h2",{id:"table-of-contents"},"Table of contents"),(0,o.kt)("h3",{id:"constructors"},"Constructors"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/capacitor/classes/PersistentTokenStorage#constructor"},"constructor"))),(0,o.kt)("h3",{id:"methods"},"Methods"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/capacitor/classes/PersistentTokenStorage#delrefreshtoken"},"delRefreshToken")),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/capacitor/classes/PersistentTokenStorage#getrefreshtoken"},"getRefreshToken")),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/capacitor/classes/PersistentTokenStorage#setrefreshtoken"},"setRefreshToken"))),(0,o.kt)("h2",{id:"constructors-1"},"Constructors"),(0,o.kt)("h3",{id:"-constructor"},(0,o.kt)("a",{id:"constructor",name:"constructor"})," constructor"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("strong",{parentName:"p"},"new PersistentTokenStorage"),"()"),(0,o.kt)("h4",{id:"defined-in"},"Defined in"),(0,o.kt)("p",null,"packages/authgear-capacitor/index.d.ts:757"),(0,o.kt)("h2",{id:"methods-1"},"Methods"),(0,o.kt)("h3",{id:"-delrefreshtoken"},(0,o.kt)("a",{id:"delrefreshtoken",name:"delrefreshtoken"})," delRefreshToken"),(0,o.kt)("p",null,"\u25b8 ",(0,o.kt)("strong",{parentName:"p"},"delRefreshToken"),"(",(0,o.kt)("inlineCode",{parentName:"p"},"namespace"),"): ",(0,o.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,o.kt)("inlineCode",{parentName:"p"},"void"),">"),(0,o.kt)("h4",{id:"parameters"},"Parameters"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"namespace")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"string"))))),(0,o.kt)("h4",{id:"returns"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,o.kt)("inlineCode",{parentName:"p"},"void"),">"),(0,o.kt)("h4",{id:"implementation-of"},"Implementation of"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/capacitor/interfaces/TokenStorage"},"TokenStorage"),".",(0,o.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/capacitor/interfaces/TokenStorage#delrefreshtoken"},"delRefreshToken")),(0,o.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,o.kt)("p",null,"packages/authgear-capacitor/index.d.ts:760"),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"-getrefreshtoken"},(0,o.kt)("a",{id:"getrefreshtoken",name:"getrefreshtoken"})," getRefreshToken"),(0,o.kt)("p",null,"\u25b8 ",(0,o.kt)("strong",{parentName:"p"},"getRefreshToken"),"(",(0,o.kt)("inlineCode",{parentName:"p"},"namespace"),"): ",(0,o.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,o.kt)("inlineCode",{parentName:"p"},"null")," ","|"," ",(0,o.kt)("inlineCode",{parentName:"p"},"string"),">"),(0,o.kt)("h4",{id:"parameters-1"},"Parameters"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"namespace")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"string"))))),(0,o.kt)("h4",{id:"returns-1"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,o.kt)("inlineCode",{parentName:"p"},"null")," ","|"," ",(0,o.kt)("inlineCode",{parentName:"p"},"string"),">"),(0,o.kt)("h4",{id:"implementation-of-1"},"Implementation of"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/capacitor/interfaces/TokenStorage"},"TokenStorage"),".",(0,o.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/capacitor/interfaces/TokenStorage#getrefreshtoken"},"getRefreshToken")),(0,o.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,o.kt)("p",null,"packages/authgear-capacitor/index.d.ts:759"),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"-setrefreshtoken"},(0,o.kt)("a",{id:"setrefreshtoken",name:"setrefreshtoken"})," setRefreshToken"),(0,o.kt)("p",null,"\u25b8 ",(0,o.kt)("strong",{parentName:"p"},"setRefreshToken"),"(",(0,o.kt)("inlineCode",{parentName:"p"},"namespace"),", ",(0,o.kt)("inlineCode",{parentName:"p"},"refreshToken"),"): ",(0,o.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,o.kt)("inlineCode",{parentName:"p"},"void"),">"),(0,o.kt)("h4",{id:"parameters-2"},"Parameters"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"namespace")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"string"))),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"refreshToken")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"string"))))),(0,o.kt)("h4",{id:"returns-2"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,o.kt)("inlineCode",{parentName:"p"},"void"),">"),(0,o.kt)("h4",{id:"implementation-of-2"},"Implementation of"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/capacitor/interfaces/TokenStorage"},"TokenStorage"),".",(0,o.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/capacitor/interfaces/TokenStorage#setrefreshtoken"},"setRefreshToken")),(0,o.kt)("h4",{id:"defined-in-3"},"Defined in"),(0,o.kt)("p",null,"packages/authgear-capacitor/index.d.ts:758"))}u.isMDXComponent=!0}}]);