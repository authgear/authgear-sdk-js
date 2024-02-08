"use strict";(self.webpackChunksite=self.webpackChunksite||[]).push([[8718],{3905:function(e,t,n){n.d(t,{Zo:function(){return k},kt:function(){return u}});var r=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var l=r.createContext({}),d=function(e){var t=r.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):s(s({},t),e)),n},k=function(e){var t=d(e.components);return r.createElement(l.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},c=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,o=e.originalType,l=e.parentName,k=i(e,["components","mdxType","originalType","parentName"]),c=d(n),u=a,m=c["".concat(l,".").concat(u)]||c[u]||p[u]||o;return n?r.createElement(m,s(s({ref:t},k),{},{components:n})):r.createElement(m,s({ref:t},k))}));function u(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=n.length,s=new Array(o);s[0]=c;var i={};for(var l in t)hasOwnProperty.call(t,l)&&(i[l]=t[l]);i.originalType=e,i.mdxType="string"==typeof e?e:a,s[1]=i;for(var d=2;d<o;d++)s[d]=n[d];return r.createElement.apply(null,s)}return r.createElement.apply(null,n)}c.displayName="MDXCreateElement"},9742:function(e,t,n){n.r(t),n.d(t,{assets:function(){return k},contentTitle:function(){return l},default:function(){return u},frontMatter:function(){return i},metadata:function(){return d},toc:function(){return p}});var r=n(3117),a=n(102),o=(n(7294),n(3905)),s=["components"],i={},l=void 0,d={unversionedId:"react-native/classes/PersistentTokenStorage",id:"react-native/classes/PersistentTokenStorage",title:"PersistentTokenStorage",description:"@authgear/react-native / PersistentTokenStorage",source:"@site/docs/react-native/classes/PersistentTokenStorage.md",sourceDirName:"react-native/classes",slug:"/react-native/classes/PersistentTokenStorage",permalink:"/authgear-sdk-js/docs/react-native/classes/PersistentTokenStorage",draft:!1,editUrl:"https://github.com/authgear/authgear-sdk-js/edit/master/website/docs/react-native/classes/PersistentTokenStorage.md",tags:[],version:"current",frontMatter:{},sidebar:"root",previous:{title:"OAuthError",permalink:"/authgear-sdk-js/docs/react-native/classes/OAuthError"},next:{title:"ReactNativeContainer",permalink:"/authgear-sdk-js/docs/react-native/classes/ReactNativeContainer"}},k={},p=[{value:"Implements",id:"implements",level:2},{value:"Table of contents",id:"table-of-contents",level:2},{value:"Constructors",id:"constructors",level:3},{value:"Methods",id:"methods",level:3},{value:"Constructors",id:"constructors-1",level:2},{value:'<a id="constructor" name="constructor"></a> constructor',id:"-constructor",level:3},{value:"Defined in",id:"defined-in",level:4},{value:"Methods",id:"methods-1",level:2},{value:'<a id="delrefreshtoken" name="delrefreshtoken"></a> delRefreshToken',id:"-delrefreshtoken",level:3},{value:"Parameters",id:"parameters",level:4},{value:"Returns",id:"returns",level:4},{value:"Implementation of",id:"implementation-of",level:4},{value:"Defined in",id:"defined-in-1",level:4},{value:'<a id="getrefreshtoken" name="getrefreshtoken"></a> getRefreshToken',id:"-getrefreshtoken",level:3},{value:"Parameters",id:"parameters-1",level:4},{value:"Returns",id:"returns-1",level:4},{value:"Implementation of",id:"implementation-of-1",level:4},{value:"Defined in",id:"defined-in-2",level:4},{value:'<a id="setrefreshtoken" name="setrefreshtoken"></a> setRefreshToken',id:"-setrefreshtoken",level:3},{value:"Parameters",id:"parameters-2",level:4},{value:"Returns",id:"returns-2",level:4},{value:"Implementation of",id:"implementation-of-2",level:4},{value:"Defined in",id:"defined-in-3",level:4}],c={toc:p};function u(e){var t=e.components,n=(0,a.Z)(e,s);return(0,o.kt)("wrapper",(0,r.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/react-native"},"@authgear/react-native")," / PersistentTokenStorage"),(0,o.kt)("h1",{id:"class-persistenttokenstorage"},"Class: PersistentTokenStorage"),(0,o.kt)("p",null,"PersistentTokenStorage stores the refresh token in a persistent storage.\nWhen the app launches again next time, the refresh token is loaded from the persistent storage.\nThe user is considered authenticated as long as the refresh token is found.\nHowever, the validity of the refresh token is not guaranteed.\nYou must call fetchUserInfo to ensure the refresh token is still valid."),(0,o.kt)("h2",{id:"implements"},"Implements"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/react-native/interfaces/TokenStorage"},(0,o.kt)("inlineCode",{parentName:"a"},"TokenStorage")))),(0,o.kt)("h2",{id:"table-of-contents"},"Table of contents"),(0,o.kt)("h3",{id:"constructors"},"Constructors"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/react-native/classes/PersistentTokenStorage#constructor"},"constructor"))),(0,o.kt)("h3",{id:"methods"},"Methods"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/react-native/classes/PersistentTokenStorage#delrefreshtoken"},"delRefreshToken")),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/react-native/classes/PersistentTokenStorage#getrefreshtoken"},"getRefreshToken")),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/react-native/classes/PersistentTokenStorage#setrefreshtoken"},"setRefreshToken"))),(0,o.kt)("h2",{id:"constructors-1"},"Constructors"),(0,o.kt)("h3",{id:"-constructor"},(0,o.kt)("a",{id:"constructor",name:"constructor"})," constructor"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("strong",{parentName:"p"},"new PersistentTokenStorage"),"()"),(0,o.kt)("h4",{id:"defined-in"},"Defined in"),(0,o.kt)("p",null,"packages/authgear-react-native/index.d.ts:585"),(0,o.kt)("h2",{id:"methods-1"},"Methods"),(0,o.kt)("h3",{id:"-delrefreshtoken"},(0,o.kt)("a",{id:"delrefreshtoken",name:"delrefreshtoken"})," delRefreshToken"),(0,o.kt)("p",null,"\u25b8 ",(0,o.kt)("strong",{parentName:"p"},"delRefreshToken"),"(",(0,o.kt)("inlineCode",{parentName:"p"},"namespace"),"): ",(0,o.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,o.kt)("inlineCode",{parentName:"p"},"void"),">"),(0,o.kt)("h4",{id:"parameters"},"Parameters"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"namespace")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"string"))))),(0,o.kt)("h4",{id:"returns"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,o.kt)("inlineCode",{parentName:"p"},"void"),">"),(0,o.kt)("h4",{id:"implementation-of"},"Implementation of"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/react-native/interfaces/TokenStorage"},"TokenStorage"),".",(0,o.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/react-native/interfaces/TokenStorage#delrefreshtoken"},"delRefreshToken")),(0,o.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,o.kt)("p",null,"packages/authgear-react-native/index.d.ts:588"),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"-getrefreshtoken"},(0,o.kt)("a",{id:"getrefreshtoken",name:"getrefreshtoken"})," getRefreshToken"),(0,o.kt)("p",null,"\u25b8 ",(0,o.kt)("strong",{parentName:"p"},"getRefreshToken"),"(",(0,o.kt)("inlineCode",{parentName:"p"},"namespace"),"): ",(0,o.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,o.kt)("inlineCode",{parentName:"p"},"null")," ","|"," ",(0,o.kt)("inlineCode",{parentName:"p"},"string"),">"),(0,o.kt)("h4",{id:"parameters-1"},"Parameters"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"namespace")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"string"))))),(0,o.kt)("h4",{id:"returns-1"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,o.kt)("inlineCode",{parentName:"p"},"null")," ","|"," ",(0,o.kt)("inlineCode",{parentName:"p"},"string"),">"),(0,o.kt)("h4",{id:"implementation-of-1"},"Implementation of"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/react-native/interfaces/TokenStorage"},"TokenStorage"),".",(0,o.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/react-native/interfaces/TokenStorage#getrefreshtoken"},"getRefreshToken")),(0,o.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,o.kt)("p",null,"packages/authgear-react-native/index.d.ts:587"),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"-setrefreshtoken"},(0,o.kt)("a",{id:"setrefreshtoken",name:"setrefreshtoken"})," setRefreshToken"),(0,o.kt)("p",null,"\u25b8 ",(0,o.kt)("strong",{parentName:"p"},"setRefreshToken"),"(",(0,o.kt)("inlineCode",{parentName:"p"},"namespace"),", ",(0,o.kt)("inlineCode",{parentName:"p"},"refreshToken"),"): ",(0,o.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,o.kt)("inlineCode",{parentName:"p"},"void"),">"),(0,o.kt)("h4",{id:"parameters-2"},"Parameters"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"namespace")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"string"))),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"refreshToken")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"string"))))),(0,o.kt)("h4",{id:"returns-2"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,o.kt)("inlineCode",{parentName:"p"},"void"),">"),(0,o.kt)("h4",{id:"implementation-of-2"},"Implementation of"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/react-native/interfaces/TokenStorage"},"TokenStorage"),".",(0,o.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/react-native/interfaces/TokenStorage#setrefreshtoken"},"setRefreshToken")),(0,o.kt)("h4",{id:"defined-in-3"},"Defined in"),(0,o.kt)("p",null,"packages/authgear-react-native/index.d.ts:586"))}u.isMDXComponent=!0}}]);