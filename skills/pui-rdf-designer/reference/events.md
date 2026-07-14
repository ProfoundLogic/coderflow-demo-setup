# Events

This reference covers event handlers in Rich Display Files — the bound JavaScript that fires in response to UI activity (`onclick`, `onload`, `onchange`, `onkeydown`, …) and lifecycle moments. Event handler property values are JS source strings stored on the widget or screen JSON, executed in a browser-side context where `pui.click()`, `getObj(id)`, and other framework APIs are available. The pages below cover the event property model, widget-level events, screen-level events, and global lifecycle hooks (typically defined in `custom.js`) that apply across every screen.

## Events

*Source: Confluence page 1596561266*

### Description
These properties gives a place to write client-side code that will run when the particular event triggers.

To use, either select the event and type into the small box provided, or click on the button ( ) and type any valid JavaScript code there. *(For more details about how to use events, see the Using Events page. For more details on JavaScript functions Profound UI provides, see the JavaScript Coding for Profound UI page.)*

### Child Page List
- **Onload**
- **Onsubmit**
- **Onmessage**
- **Onkeydown (Screen Level)**
- **Onkeypress (Screen Level)**
- **Onkeyup (Screen Level)**

---

## Using Events

*Source: Confluence page 1596558259*

The example described on this page is also included in the Profound UI Samples Library (**PUISAMPLES**) that is automatically installed onto your system when you install Profound UI.

- **Display file source:** PUISAMPLES/QDDSSRC/**DROPD005D**

- **RPGLE source:** PUISAMPLES/QRPGLESRC/**DROPD005R**
### Description
Widgets in Profound UI can also respond to events, such as *onclick* or *onchange*. This allows us to add even more dynamic functionality to the Web Application using client-side JavaScript code. There are two ways to write code for JavaScript events: inline, or in an external JavaScript file. 

- When using an external file, you will generally place it on the IFS, somewhere in the following directory:

  - */www/profoundui/htdocs/profoundui/userdata/  *

- You should then reference the external JavaScript file from the following IFS directory, using a \<script\> tag:

  - */www/profoundui/htdocs/profoundui/userdata/html/start.html*

If the JavaScript functionality is fairly simple, writing the code inline may be preferred. Simply prompt the event in the Properties Window, and type the code (as shown below):

**Helpful JavaScript API Functions**

Profound UI provides a number of useful JavaScript API functions to make coding easier. The two most commonly used API functions are described below:

- **pui.click()** – Submits a response to the server. This API can accept an optional parameter containing an ID or an object reference to a button, or a similar element, that has a bound response property to be sent to the server.  Sample usage:

```js
// Send response to server
pui.click();
// Send response to server by triggering the Exit button.
pui.click(“Exit”);
```
- **getObj()** – Retrieves a reference to the DOM (i.e., browser’s Document Object Model) element given an element ID. The function can be used to retrieve and set the content, or CSS style, of an element.  Sample usage:

```js
// Clear the customer number box
getObj(“CustBox”).value = “”;
// If the content of the output field with the ID of Amount is less than 0,
// make the output field appear in red.
if (Number(getObj(“Amount”).innerHTML) < 0) getObj(“Amount”).style.color = “Red”;
```
**Notes:**

1.  JavaScript and element IDs are *case sensitive*.

2.  In addition to attaching events to widgets, you may also attach events, such as *onload* and *onsubmit*, to the screen itself.

---

## Widget Events

*Source: Confluence page 1604786360*

### Description
The following is a list of widget events. Widget events are defined on *specific* widgets, using the “Properties” Window in the Visual Designer.

### Child Page List
- **onblur event**
- **onchange event**
- **onchartclick event (Chart)**
- **onclick event**
- **ondblclick event**
- **ondbload event**
- **ondragenter event**
- **ondragleave event**
- **ondragstart event**
- **ondrop event**
- **onfilterchange event (Grid)**
- **onfocus event**
- **onkeydown event**
- **onkeypress event**
- **onkeyup event**
- **onlazyload**
- **onmousedown event**
- **onmousemove event**
- **onmouseout event**
- **onmouseover event**
- **onmouseup event**
- **onoptionclick event (Menu)**
- **onpagedown event (Grid)**
- **onpageup event (Grid)**
- **onrowclick event (Grid)**
- **onrowdblclick event (Grid)**
- **onrowmouseout event (Grid)**
- **onrowmouseover event (Grid)**
- **onscroll event (Grid)**
- **onsectionclick event (Accordion Layout)**
- **onselect event (Combo Box)**
- **onselect event (Textbox)**
- **onspin event (Spinner)**
- **ontabclick event (Tab Panel)**

---

## Screen Events

*Source: Confluence page 1604786258*

### Overview
The following is a list of screen-level events. Screen-level events are defined on *specific* screens using the “Screen Properties” Window in the Visual Designer.

### Child Page List
- **onload event**
- **onpageload event (Genie)**
- **onsubmit event**
- **subfile row onclick (Genie)**
- **subfile row ondblclick (Genie)**

---

## Global Events

*Source: Confluence page 1604785904*

### Description
The following is a list of global events, which will fire on every single screen.

For Genie, there are several events that occur when a screen is loading. The order of these events are as follows:

1.  **beforeLoad()** in the “custom.js” file.

2.  5250 data is rendered.

3.  **customize()** in the “custom.js” file.

4.  **pui.genie.afterInit** in the “custom.js” file.

5.  Screen customizations made with the Designer are applied.

6.  **afterLoad()** in the “custom.js” file.

7.  **pui.genie.onalarm** in the “custom.js” file.
### Child Page List
- **afterLoad function (Genie)**
- **beforeLoad function (Genie)**
- **customize function (Genie)**
- **pui.beforeRender**
- **pui.beforeRespond**
- **pui.genie.afterInit (Genie)**
- **pui.genie.onalarm (Genie)**
- **pui.inputfilter**
- **pui.onbeforetimeout**
- **pui.onload**
- **pui.onoffline**
- **pui.onPCCommand function**
- **pui.onshutdown (Genie)**
- **pui.onsubmit**
- **pui.ontimeout**
- **pui.onuseractivity**
- **pui.overrideSubmitUrl**
- **pui.validate**
