const style = `
:host {
    display: inline-block;
    position: relative;
    width: 200px;
  }
  
  .input {
    display: block;
    width: 100%;
    padding: 10px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    outline: none;
  }
  
  .list {
    position: absolute;
    top: calc(100% + 2.5px);
    width: 100%;
    padding: 10px;
    left: 0;
    right: 0;
    max-height: 200px;
    overflow-y: auto;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    z-index: 1;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    pointer-events: none;
  }
  
  .input:focus + .list {
    opacity: 1;
    pointer-events: auto;
  }

  ul {
    list-style-type: none;
  }
  
  .option {
    padding: 10px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.1s ease-in-out;
  }
  
  .option:hover,
  .option:focus,
  .selected {
    background-color: #f2f2f2;
  }
  
  .selected {
    background-color: #0077cc;
    color: #fff;
  }
  
  .selected:hover {
    background-color: #005ea8;
  }
  
`;

class Combobox extends HTMLElement {
  static get observedAttributes() {
    return ["options"];
  }

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    const styleEl = document.createElement("style");
    styleEl.textContent = style
    shadow.appendChild(styleEl);

    const wrapper = document.createElement("div");
    wrapper.setAttribute("class", "wrapper");

    const input = document.createElement("input");
    input.setAttribute("type", "text");
    input.setAttribute("class", "input");
    input.setAttribute("aria-haspopup", "listbox");
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("autocomplete", "off");
    input.setAttribute("spellcheck", "false");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-owns", `${this.id}-list`);
    input.setAttribute("aria-describedby", `${this.id}-instructions`);
    input.setAttribute("tabindex", "0");
    input.addEventListener("input", this._onInputChange.bind(this));
    input.addEventListener("keydown", this._onInputKeyDown.bind(this));
    input.addEventListener("focus", this._onInputFocus.bind(this));
    input.addEventListener("blur", this._onInputBlur.bind(this));

    const list = document.createElement("ul");
    list.setAttribute("class", "list");
    list.setAttribute("id", `${this.id}-list`);
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-labelledby", `${this.id}-label`);

    wrapper.appendChild(input);
    wrapper.appendChild(list);
    shadow.appendChild(wrapper);

    this._options = [];
    this._selectedIndex = -1;
  }

  get options() {
    return JSON.parse(this.getAttribute("options"));
  }

  set options(value) {
    this.setAttribute("options", JSON.stringify(value));
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "options") {
      this._renderOptions();
    }
  }

  _onInputChange() {
    const input = this.shadowRoot.querySelector(".input");
    const list = this.shadowRoot.querySelector(".list");

    const filter = input.value.toLowerCase();

    // actually filter results here
    for (let i = 0; i < list.children.length; i++) {
      const option = list.children[i];

      if (option.textContent.toLowerCase().indexOf(filter) !== -1) {
        option.style.display = "";
      } else {
        option.style.display = "none";
      }
    }

    this._selectedIndex = -1;
  }

  _onInputKeyDown(event) {
    const list = this.shadowRoot.querySelector(".list");
    const options = list.querySelectorAll("li");
    const input = this.shadowRoot.querySelector(".input");

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        this._selectOption(this._selectedIndex - 1, options);
        break;
      case "ArrowDown":
        event.preventDefault();
        this._selectOption(this._selectedIndex + 1, options);
        break;
      case "Enter":
        if (this._selectedIndex !== -1) {
          const selectedOption = options[this._selectedIndex];
          this._select(selectedOption);
        }
        break;
      case "Escape":
        input.blur();
        break;
    }
  }

  _onInputFocus() {
    const input = this.shadowRoot.querySelector(".input");
    input.setAttribute("aria-expanded", "true");
  }

  _onInputBlur() {
    const input = this.shadowRoot.querySelector(".input");
    input.setAttribute("aria-expanded", "false");
  }
  _renderOptions() {
    const list = this.shadowRoot.querySelector(".list");
    list.innerHTML = "";

    for (let i = 0; i < this.options.length; i++) {
      const option = this.options[i];
      const li = document.createElement("li");
      li.setAttribute("class", "option");
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      li.setAttribute("id", `${this.id}-option-${i}`);
      li.textContent = option;
      li.addEventListener("mousedown", this._onOptionMouseDown.bind(this));
      li.addEventListener("mouseover", this._onOptionMouseOver.bind(this));
      list.appendChild(li);
    }
  }

  _selectOption(index, options) {
    if (index < 0) {
      index = options.length - 1;
    } else if (index >= options.length) {
      index = 0;
    }

    this._selectedIndex = index;

    const input = this.shadowRoot.querySelector(".input");
    const list = this.shadowRoot.querySelector(".list");
    const selectedOption = options[index];

    for (let i = 0; i < options.length; i++) {
      const option = options[i];

      if (option === selectedOption) {
        option.setAttribute("aria-selected", "true");
        option.classList.add("selected");
        input.setAttribute("aria-activedescendant", option.getAttribute("id"));
        list.scrollTop =
          option.offsetTop - list.offsetHeight + option.offsetHeight;
      } else {
        option.setAttribute("aria-selected", "false");
        option.classList.remove("selected");
      }
    }
  }

  _onOptionMouseDown(event) {
    event.preventDefault();
    const selectedOption = event.currentTarget;
    this._select(selectedOption);
  }

  _onOptionMouseOver(event) {
    const options = this.shadowRoot.querySelectorAll(".option");
    const selectedOption = event.currentTarget;
    const index = Array.from(options).indexOf(selectedOption);
    this._selectOption(index, options);
  }

  _select(selectedOption) {
    if (selectedOption) {
      const input = this.shadowRoot.querySelector(".input");
      input.value = selectedOption.textContent;
      this._selectedIndex = Array.from(
        selectedOption.parentNode.children
      ).indexOf(selectedOption);
      input.setAttribute("aria-activedescendant", "");
      input.focus();
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { value: selectedOption.textContent },
        })
      );
    }
  }
}

customElements.define("ml-combobox", Combobox);
