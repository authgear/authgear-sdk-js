"use strict";(self.webpackChunksite=self.webpackChunksite||[]).push([[9162],{3905:function(e,t,n){n.d(t,{Zo:function(){return k},kt:function(){return m}});var r=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var l=r.createContext({}),d=function(e){var t=r.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},k=function(e){var t=d(e.components);return r.createElement(l.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},c=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,i=e.originalType,l=e.parentName,k=s(e,["components","mdxType","originalType","parentName"]),c=d(n),m=a,u=c["".concat(l,".").concat(m)]||c[m]||p[m]||i;return n?r.createElement(u,o(o({ref:t},k),{},{components:n})):r.createElement(u,o({ref:t},k))}));function m(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var i=n.length,o=new Array(i);o[0]=c;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s.mdxType="string"==typeof e?e:a,o[1]=s;for(var d=2;d<i;d++)o[d]=n[d];return r.createElement.apply(null,o)}return r.createElement.apply(null,n)}c.displayName="MDXCreateElement"},5767:function(e,t,n){n.r(t),n.d(t,{assets:function(){return k},contentTitle:function(){return l},default:function(){return m},frontMatter:function(){return s},metadata:function(){return d},toc:function(){return p}});var r=n(3117),a=n(102),i=(n(7294),n(3905)),o=["components"],s={},l=void 0,d={unversionedId:"react-native/classes/TransientTokenStorage",id:"react-native/classes/TransientTokenStorage",title:"TransientTokenStorage",description:"@authgear/react-native / TransientTokenStorage",source:"@site/docs/react-native/classes/TransientTokenStorage.md",sourceDirName:"react-native/classes",slug:"/react-native/classes/TransientTokenStorage",permalink:"/authgear-sdk-js/docs/react-native/classes/TransientTokenStorage",draft:!1,editUrl:"https://github.com/authgear/authgear-sdk-js/edit/master/website/docs/react-native/classes/TransientTokenStorage.md",tags:[],version:"current",frontMatter:{},sidebar:"root",previous:{title:"ServerError",permalink:"/authgear-sdk-js/docs/react-native/classes/ServerError"},next:{title:"WebKitWebViewUIImplementation",permalink:"/authgear-sdk-js/docs/react-native/classes/WebKitWebViewUIImplementation"}},k={},p=[{value:"Implements",id:"implements",level:2},{value:"Table of contents",id:"table-of-contents",level:2},{value:"Constructors",id:"constructors",level:3},{value:"Methods",id:"methods",level:3},{value:"Constructors",id:"constructors-1",level:2},{value:'<a id="constructor" name="constructor"></a> constructor',id:"-constructor",level:3},{value:"Defined in",id:"defined-in",level:4},{value:"Methods",id:"methods-1",level:2},{value:'<a id="delrefreshtoken" name="delrefreshtoken"></a> delRefreshToken',id:"-delrefreshtoken",level:3},{value:"Parameters",id:"parameters",level:4},{value:"Returns",id:"returns",level:4},{value:"Implementation of",id:"implementation-of",level:4},{value:"Defined in",id:"defined-in-1",level:4},{value:'<a id="getrefreshtoken" name="getrefreshtoken"></a> getRefreshToken',id:"-getrefreshtoken",level:3},{value:"Parameters",id:"parameters-1",level:4},{value:"Returns",id:"returns-1",level:4},{value:"Implementation of",id:"implementation-of-1",level:4},{value:"Defined in",id:"defined-in-2",level:4},{value:'<a id="setrefreshtoken" name="setrefreshtoken"></a> setRefreshToken',id:"-setrefreshtoken",level:3},{value:"Parameters",id:"parameters-2",level:4},{value:"Returns",id:"returns-2",level:4},{value:"Implementation of",id:"implementation-of-2",level:4},{value:"Defined in",id:"defined-in-3",level:4}],c={toc:p};function m(e){var t=e.components,n=(0,a.Z)(e,o);return(0,i.kt)("wrapper",(0,r.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/react-native"},"@authgear/react-native")," / TransientTokenStorage"),(0,i.kt)("h1",{id:"class-transienttokenstorage"},"Class: TransientTokenStorage"),(0,i.kt)("p",null,"TransientTokenStorage stores the refresh token in memory.\nThe refresh token is forgotten as soon as the user quits the app, or\nthe app was killed by the system.\nWhen the app launches again next time, no refresh token is found.\nThe user is considered unauthenticated.\nThis implies the user needs to authenticate over again on every app launch."),(0,i.kt)("h2",{id:"implements"},"Implements"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/react-native/interfaces/TokenStorage"},(0,i.kt)("inlineCode",{parentName:"a"},"TokenStorage")))),(0,i.kt)("h2",{id:"table-of-contents"},"Table of contents"),(0,i.kt)("h3",{id:"constructors"},"Constructors"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/react-native/classes/TransientTokenStorage#constructor"},"constructor"))),(0,i.kt)("h3",{id:"methods"},"Methods"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/react-native/classes/TransientTokenStorage#delrefreshtoken"},"delRefreshToken")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/react-native/classes/TransientTokenStorage#getrefreshtoken"},"getRefreshToken")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/react-native/classes/TransientTokenStorage#setrefreshtoken"},"setRefreshToken"))),(0,i.kt)("h2",{id:"constructors-1"},"Constructors"),(0,i.kt)("h3",{id:"-constructor"},(0,i.kt)("a",{id:"constructor",name:"constructor"})," constructor"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"new TransientTokenStorage"),"()"),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,"packages/authgear-react-native/index.d.ts:211"),(0,i.kt)("h2",{id:"methods-1"},"Methods"),(0,i.kt)("h3",{id:"-delrefreshtoken"},(0,i.kt)("a",{id:"delrefreshtoken",name:"delrefreshtoken"})," delRefreshToken"),(0,i.kt)("p",null,"\u25b8 ",(0,i.kt)("strong",{parentName:"p"},"delRefreshToken"),"(",(0,i.kt)("inlineCode",{parentName:"p"},"namespace"),"): ",(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("inlineCode",{parentName:"p"},"void"),">"),(0,i.kt)("h4",{id:"parameters"},"Parameters"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"namespace")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"string"))))),(0,i.kt)("h4",{id:"returns"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("inlineCode",{parentName:"p"},"void"),">"),(0,i.kt)("h4",{id:"implementation-of"},"Implementation of"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/react-native/interfaces/TokenStorage"},"TokenStorage"),".",(0,i.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/react-native/interfaces/TokenStorage#delrefreshtoken"},"delRefreshToken")),(0,i.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,i.kt)("p",null,"packages/authgear-react-native/index.d.ts:214"),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"-getrefreshtoken"},(0,i.kt)("a",{id:"getrefreshtoken",name:"getrefreshtoken"})," getRefreshToken"),(0,i.kt)("p",null,"\u25b8 ",(0,i.kt)("strong",{parentName:"p"},"getRefreshToken"),"(",(0,i.kt)("inlineCode",{parentName:"p"},"namespace"),"): ",(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("inlineCode",{parentName:"p"},"null")," ","|"," ",(0,i.kt)("inlineCode",{parentName:"p"},"string"),">"),(0,i.kt)("h4",{id:"parameters-1"},"Parameters"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"namespace")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"string"))))),(0,i.kt)("h4",{id:"returns-1"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("inlineCode",{parentName:"p"},"null")," ","|"," ",(0,i.kt)("inlineCode",{parentName:"p"},"string"),">"),(0,i.kt)("h4",{id:"implementation-of-1"},"Implementation of"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/react-native/interfaces/TokenStorage"},"TokenStorage"),".",(0,i.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/react-native/interfaces/TokenStorage#getrefreshtoken"},"getRefreshToken")),(0,i.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,i.kt)("p",null,"packages/authgear-react-native/index.d.ts:213"),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"-setrefreshtoken"},(0,i.kt)("a",{id:"setrefreshtoken",name:"setrefreshtoken"})," setRefreshToken"),(0,i.kt)("p",null,"\u25b8 ",(0,i.kt)("strong",{parentName:"p"},"setRefreshToken"),"(",(0,i.kt)("inlineCode",{parentName:"p"},"namespace"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"refreshToken"),"): ",(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("inlineCode",{parentName:"p"},"void"),">"),(0,i.kt)("h4",{id:"parameters-2"},"Parameters"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"namespace")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"string"))),(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"refreshToken")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"string"))))),(0,i.kt)("h4",{id:"returns-2"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("inlineCode",{parentName:"p"},"void"),">"),(0,i.kt)("h4",{id:"implementation-of-2"},"Implementation of"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/react-native/interfaces/TokenStorage"},"TokenStorage"),".",(0,i.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/react-native/interfaces/TokenStorage#setrefreshtoken"},"setRefreshToken")),(0,i.kt)("h4",{id:"defined-in-3"},"Defined in"),(0,i.kt)("p",null,"packages/authgear-react-native/index.d.ts:212"))}m.isMDXComponent=!0}}]);