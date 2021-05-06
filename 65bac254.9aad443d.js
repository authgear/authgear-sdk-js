(window.webpackJsonp=window.webpackJsonp||[]).push([[18],{153:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return o})),n.d(t,"metadata",(function(){return c})),n.d(t,"rightToc",(function(){return s})),n.d(t,"default",(function(){return l}));var r=n(2),i=n(9),a=(n(0),n(176)),o={title:"ConfigureOptions",sidebar_label:"ConfigureOptions"},c={id:"react-native/interfaces/configureoptions",title:"ConfigureOptions",description:"@authgear/react-native \u203a ConfigureOptions",source:"@site/docs/react-native/interfaces/configureoptions.md",permalink:"/authgear-sdk-js/docs/react-native/interfaces/configureoptions",editUrl:"https://github.com/authgear/authgear-sdk-js/edit/master/website/docs/react-native/interfaces/configureoptions.md",sidebar_label:"ConfigureOptions",sidebar:"root",previous:{title:"BiometricPrivateKeyOptionsIOS",permalink:"/authgear-sdk-js/docs/react-native/interfaces/biometricprivatekeyoptionsios"},next:{title:"ContainerOptions",permalink:"/authgear-sdk-js/docs/react-native/interfaces/containeroptions"}},s=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Index",id:"index",children:[{value:"Properties",id:"properties",children:[]}]},{value:"Properties",id:"properties-1",children:[{value:'<a id="clientid" name="clientid"></a>  clientID',id:"clientid",children:[]},{value:'<a id="endpoint" name="endpoint"></a>  endpoint',id:"endpoint",children:[]},{value:'<a id="optional-transientsession" name="optional-transientsession"></a> <code>Optional</code> transientSession',id:"optional-transientsession",children:[]}]}],p={rightToc:s};function l(e){var t=e.components,n=Object(i.a)(e,["components"]);return Object(a.b)("wrapper",Object(r.a)({},p,n,{components:t,mdxType:"MDXLayout"}),Object(a.b)("p",null,Object(a.b)("a",Object(r.a)({parentName:"p"},{href:"/authgear-sdk-js/docs/react-native/index"}),"@authgear/react-native")," \u203a ",Object(a.b)("a",Object(r.a)({parentName:"p"},{href:"/authgear-sdk-js/docs/react-native/interfaces/configureoptions"}),"ConfigureOptions")),Object(a.b)("h2",{id:"hierarchy"},"Hierarchy"),Object(a.b)("ul",null,Object(a.b)("li",{parentName:"ul"},Object(a.b)("strong",{parentName:"li"},"ConfigureOptions"))),Object(a.b)("h2",{id:"index"},"Index"),Object(a.b)("h3",{id:"properties"},"Properties"),Object(a.b)("ul",null,Object(a.b)("li",{parentName:"ul"},Object(a.b)("a",Object(r.a)({parentName:"li"},{href:"/authgear-sdk-js/docs/react-native/interfaces/configureoptions#clientid"}),"clientID")),Object(a.b)("li",{parentName:"ul"},Object(a.b)("a",Object(r.a)({parentName:"li"},{href:"/authgear-sdk-js/docs/react-native/interfaces/configureoptions#endpoint"}),"endpoint")),Object(a.b)("li",{parentName:"ul"},Object(a.b)("a",Object(r.a)({parentName:"li"},{href:"/authgear-sdk-js/docs/react-native/interfaces/configureoptions#optional-transientsession"}),"transientSession"))),Object(a.b)("h2",{id:"properties-1"},"Properties"),Object(a.b)("h3",{id:"clientid"},Object(a.b)("a",{id:"clientid",name:"clientid"}),"  clientID"),Object(a.b)("p",null,"\u2022 ",Object(a.b)("strong",{parentName:"p"},"clientID"),": ",Object(a.b)("em",{parentName:"p"},"string")),Object(a.b)("p",null,"The OAuth client ID."),Object(a.b)("hr",null),Object(a.b)("h3",{id:"endpoint"},Object(a.b)("a",{id:"endpoint",name:"endpoint"}),"  endpoint"),Object(a.b)("p",null,"\u2022 ",Object(a.b)("strong",{parentName:"p"},"endpoint"),": ",Object(a.b)("em",{parentName:"p"},"string")),Object(a.b)("p",null,"The endpoint."),Object(a.b)("hr",null),Object(a.b)("h3",{id:"optional-transientsession"},Object(a.b)("a",{id:"optional-transientsession",name:"optional-transientsession"})," ",Object(a.b)("inlineCode",{parentName:"h3"},"Optional")," transientSession"),Object(a.b)("p",null,"\u2022 ",Object(a.b)("strong",{parentName:"p"},"transientSession"),"? : ",Object(a.b)("em",{parentName:"p"},"boolean")),Object(a.b)("p",null,"transientSession indicate if the session in SDK is short-lived session.\nIf transientSession is true means the session is short-lived session and won't be persist.\nIn react-native app, the session will be gone when calling authgear.configure."))}l.isMDXComponent=!0},176:function(e,t,n){"use strict";n.d(t,"a",(function(){return b})),n.d(t,"b",(function(){return O}));var r=n(0),i=n.n(r);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function c(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var p=i.a.createContext({}),l=function(e){var t=i.a.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):c(c({},t),e)),n},b=function(e){var t=l(e.components);return i.a.createElement(p.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return i.a.createElement(i.a.Fragment,{},t)}},d=i.a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,a=e.originalType,o=e.parentName,p=s(e,["components","mdxType","originalType","parentName"]),b=l(n),d=r,O=b["".concat(o,".").concat(d)]||b[d]||u[d]||a;return n?i.a.createElement(O,c(c({ref:t},p),{},{components:n})):i.a.createElement(O,c({ref:t},p))}));function O(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var a=n.length,o=new Array(a);o[0]=d;var c={};for(var s in t)hasOwnProperty.call(t,s)&&(c[s]=t[s]);c.originalType=e,c.mdxType="string"==typeof e?e:r,o[1]=c;for(var p=2;p<a;p++)o[p]=n[p];return i.a.createElement.apply(null,o)}return i.a.createElement.apply(null,n)}d.displayName="MDXCreateElement"}}]);