"use strict";(self.webpackChunksite=self.webpackChunksite||[]).push([[4421],{3905:function(e,t,a){a.d(t,{Zo:function(){return l},kt:function(){return f}});var n=a(7294);function r(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function i(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function o(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?i(Object(a),!0).forEach((function(t){r(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):i(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function s(e,t){if(null==e)return{};var a,n,r=function(e,t){if(null==e)return{};var a,n,r={},i=Object.keys(e);for(n=0;n<i.length;n++)a=i[n],t.indexOf(a)>=0||(r[a]=e[a]);return r}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(n=0;n<i.length;n++)a=i[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(r[a]=e[a])}return r}var c=n.createContext({}),p=function(e){var t=n.useContext(c),a=t;return e&&(a="function"==typeof e?e(t):o(o({},t),e)),a},l=function(e){var t=p(e.components);return n.createElement(c.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},u=n.forwardRef((function(e,t){var a=e.components,r=e.mdxType,i=e.originalType,c=e.parentName,l=s(e,["components","mdxType","originalType","parentName"]),u=p(a),f=r,m=u["".concat(c,".").concat(f)]||u[f]||d[f]||i;return a?n.createElement(m,o(o({ref:t},l),{},{components:a})):n.createElement(m,o({ref:t},l))}));function f(e,t){var a=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var i=a.length,o=new Array(i);o[0]=u;var s={};for(var c in t)hasOwnProperty.call(t,c)&&(s[c]=t[c]);s.originalType=e,s.mdxType="string"==typeof e?e:r,o[1]=s;for(var p=2;p<i;p++)o[p]=a[p];return n.createElement.apply(null,o)}return n.createElement.apply(null,a)}u.displayName="MDXCreateElement"},8118:function(e,t,a){a.r(t),a.d(t,{assets:function(){return l},contentTitle:function(){return c},default:function(){return f},frontMatter:function(){return s},metadata:function(){return p},toc:function(){return d}});var n=a(3117),r=a(102),i=(a(7294),a(3905)),o=["components"],s={},c=void 0,p={unversionedId:"capacitor/interfaces/CapacitorContainerDelegate",id:"capacitor/interfaces/CapacitorContainerDelegate",title:"CapacitorContainerDelegate",description:"@authgear/capacitor / CapacitorContainerDelegate",source:"@site/docs/capacitor/interfaces/CapacitorContainerDelegate.md",sourceDirName:"capacitor/interfaces",slug:"/capacitor/interfaces/CapacitorContainerDelegate",permalink:"/authgear-sdk-js/docs/capacitor/interfaces/CapacitorContainerDelegate",draft:!1,editUrl:"https://github.com/authgear/authgear-sdk-js/edit/master/website/docs/capacitor/interfaces/CapacitorContainerDelegate.md",tags:[],version:"current",frontMatter:{},sidebar:"root",previous:{title:"BiometricOptionsIOS",permalink:"/authgear-sdk-js/docs/capacitor/interfaces/BiometricOptionsIOS"},next:{title:"ConfigureOptions",permalink:"/authgear-sdk-js/docs/capacitor/interfaces/ConfigureOptions"}},l={},d=[{value:"Table of contents",id:"table-of-contents",level:2},{value:"Properties",id:"properties",level:3},{value:"Properties",id:"properties-1",level:2},{value:'<a id="onsessionstatechange" name="onsessionstatechange"></a> onSessionStateChange',id:"-onsessionstatechange",level:3},{value:"Type declaration",id:"type-declaration",level:4},{value:"Parameters",id:"parameters",level:5},{value:"Returns",id:"returns",level:5},{value:"Defined in",id:"defined-in",level:4}],u={toc:d};function f(e){var t=e.components,a=(0,r.Z)(e,o);return(0,i.kt)("wrapper",(0,n.Z)({},u,a,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/capacitor"},"@authgear/capacitor")," / CapacitorContainerDelegate"),(0,i.kt)("h1",{id:"interface-capacitorcontainerdelegate"},"Interface: CapacitorContainerDelegate"),(0,i.kt)("h2",{id:"table-of-contents"},"Table of contents"),(0,i.kt)("h3",{id:"properties"},"Properties"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/capacitor/interfaces/CapacitorContainerDelegate#onsessionstatechange"},"onSessionStateChange"))),(0,i.kt)("h2",{id:"properties-1"},"Properties"),(0,i.kt)("h3",{id:"-onsessionstatechange"},(0,i.kt)("a",{id:"onsessionstatechange",name:"onsessionstatechange"})," onSessionStateChange"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"onSessionStateChange"),": (",(0,i.kt)("inlineCode",{parentName:"p"},"container"),": ",(0,i.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/capacitor/classes/CapacitorContainer"},(0,i.kt)("inlineCode",{parentName:"a"},"CapacitorContainer")),", ",(0,i.kt)("inlineCode",{parentName:"p"},"reason"),": ",(0,i.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/capacitor/enums/SessionStateChangeReason"},(0,i.kt)("inlineCode",{parentName:"a"},"SessionStateChangeReason")),") => ",(0,i.kt)("inlineCode",{parentName:"p"},"void")),(0,i.kt)("h4",{id:"type-declaration"},"Type declaration"),(0,i.kt)("p",null,"\u25b8 (",(0,i.kt)("inlineCode",{parentName:"p"},"container"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"reason"),"): ",(0,i.kt)("inlineCode",{parentName:"p"},"void")),(0,i.kt)("p",null,"This callback will be called when the session state is changed."),(0,i.kt)("p",null,'For example, when the user logs out, the new state is "NO_SESSION"\nand the reason is "LOGOUT".'),(0,i.kt)("h5",{id:"parameters"},"Parameters"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"container")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("a",{parentName:"td",href:"/authgear-sdk-js/docs/capacitor/classes/CapacitorContainer"},(0,i.kt)("inlineCode",{parentName:"a"},"CapacitorContainer")))),(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"reason")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("a",{parentName:"td",href:"/authgear-sdk-js/docs/capacitor/enums/SessionStateChangeReason"},(0,i.kt)("inlineCode",{parentName:"a"},"SessionStateChangeReason")))))),(0,i.kt)("h5",{id:"returns"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"void")),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,"packages/authgear-capacitor/index.d.ts:697"))}f.isMDXComponent=!0}}]);