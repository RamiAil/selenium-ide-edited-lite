/*
 * Common classes / functions for Selenium RC format.
 */

if (!this.formatterType) {  // this.formatterType is defined for the new Formatter system
  // This method (the if block) of loading the formatter type is deprecated.
  // For new formatters, simply specify the type in the addPluginProvidedFormatter() and omit this
  // if block in your formatter.
  var subScriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
  subScriptLoader.loadSubScript('chrome://selenium-ide/content/formats/formatCommandOnlyAdapter.js', this);
}

/* @override
 * This function filters the command list and strips away the commands we no longer need
 * or changes the command to another one.
 * NOTE: do not change the existing command directly or it will also change in the test case.
 */
this.postFilter = function(originalCommands) {
  var commands = [];
  var commandsToSkip = {
    'waitForPageToLoad' : 1,
    'pause': 1
  };
  var rc;
  for (var i = 0; i < originalCommands.length; i++) {
    var c = originalCommands[i];
    if (c.type == 'command') {
      if (commandsToSkip[c.command] && commandsToSkip[c.command] == 1) {
        //Skip
      } else if (rc = SeleneseMapper.remap(c)) {  //Yes, this IS an assignment
        //Remap
        commands.push.apply(commands, rc);
      } else {
        commands.push(c);
      }
    } else {
      commands.push(c);
    }
  }
  return commands;
};

/* SeleneseMapper changes one Selenese command to another that is more suitable for WebDriver export
 */
function SeleneseMapper() {
}

SeleneseMapper.remap = function(cmd) {
/*
  for (var mapper in SeleneseMapper) {
    if (SeleneseMapper.hasOwnProperty(mapper) && typeof SeleneseMapper.mapper.isDefined === 'function'  && typeof SeleneseMapper.mapper.convert === 'function') {
      if (SeleneseMapper.mapper.isDefined(cmd)) {
        return SeleneseMapper.mapper.convert(cmd);
      }
    }
  }
*/
  // NOTE The above code is useful if there are more than one mappers, since there is just one, it is more efficient to call it directly
  if (SeleneseMapper.IsTextPresent.isDefined(cmd)) {
    return SeleneseMapper.IsTextPresent.convert(cmd);
  }
  return null;
};

SeleneseMapper.IsTextPresent = {
  isTextPresentRegex: /^(assert|verify|waitFor)Text(Not)?Present$/,
  isPatternRegex: /^(regexp|regexpi|regex):/,
  exactRegex: /^exact:/,

  isDefined:function (cmd) {
    return this.isTextPresentRegex.test(cmd.command);
  },

  convert:function (cmd) {
    if (this.isTextPresentRegex.test(cmd.command)) {
      var pattern = cmd.target;
      if (!this.isPatternRegex.test(pattern)) {
        if (this.exactRegex.test(pattern)) {
          //TODO how to escape wildcards in an glob pattern?
          pattern = pattern.replace(this.exactRegex, 'glob:*') + '*';
        } else {
          //glob
          pattern = pattern.replace(/^(glob:)?\*?/, 'glob:*');
          if (!/\*$/.test(pattern)) {
            pattern += '*';
          }
        }
      }
      var remappedCmd = new Command(cmd.command.replace(this.isTextPresentRegex, "$1$2Text"), 'css=BODY', pattern);
      remappedCmd.remapped = cmd;
      return [new Comment('Warning: ' + cmd.command + ' may require manual changes'), remappedCmd];
    }
  }
};

function formatHeader(testCase) {
  var className = testCase.getTitle();
  if (!className) {
    className = "NewTest";
  }
  className = testClassName(className);
  var formatLocal = testCase.formatLocal(this.name);
  methodName = testMethodName(className.replace(/Test$/i, "").replace(/^Test/i, "").replace(/^[A-Z]/, function(str) {
    return str.toLowerCase();
  }));
  var header = (options.getHeader ? options.getHeader() : options.header).
      replace(/\$\{className\}/g, className).
      replace(/\$\{methodName\}/g, methodName).
      replace(/\$\{baseURL\}/g, testCase.getBaseURL()).
      replace(/\$\{([a-zA-Z0-9_]+)\}/g, function(str, name) {
        return options[name];
      });
  this.lastIndent = indents(parseInt(options.initialIndents, 10));
  formatLocal.header = header;
  return formatLocal.header;
}

function formatFooter(testCase) {
  var formatLocal = testCase.formatLocal(this.name);
  formatLocal.footer = options.footer;
  return formatLocal.footer;
}

function indents(num) {
  function repeat(c, n) {
    var str = "";
    for (var i = 0; i < n; i++) {
      str += c;
    }
    return str;
  }

  try {
    var indent = options.indent;
    if ('tab' == indent) {
      return repeat("\t", num);
    } else {
      return repeat(" ", num * parseInt(options.indent, 10));
    }
  } catch (error) {
    return repeat(" ", 0);
  }
}

function capitalize(string) {
  return string.replace(/^[a-z]/, function(str) {
    return str.toUpperCase();
  });
}

function underscore(text) {
  return text.replace(/[A-Z]/g, function(str) {
    return '_' + str.toLowerCase();
  });
}

function notOperator() {
  return "!";
}

function logicalAnd(conditions) {
  return conditions.join(" && ");
}

function equals(e1, e2) {
  return new Equals(e1, e2);
}

function Equals(e1, e2) {
  this.e1 = e1;
  this.e2 = e2;
}

Equals.prototype.invert = function() {
  return new NotEquals(this.e1, this.e2);
};

function NotEquals(e1, e2) {
  this.e1 = e1;
  this.e2 = e2;
  this.negative = true;
}

NotEquals.prototype.invert = function() {
  return new Equals(this.e1, this.e2);
};

function RegexpMatch(pattern, expression) {
  this.pattern = pattern;
  this.expression = expression;
}

RegexpMatch.prototype.invert = function() {
  return new RegexpNotMatch(this.pattern, this.expression);
};

RegexpMatch.prototype.assert = function() {
  return assertTrue(this.toString());
};

RegexpMatch.prototype.verify = function() {
  return verifyTrue(this.toString());
};

function RegexpNotMatch(pattern, expression) {
  this.pattern = pattern;
  this.expression = expression;
  this.negative = true;
}

RegexpNotMatch.prototype.invert = function() {
  return new RegexpMatch(this.pattern, this.expression);
};

RegexpNotMatch.prototype.toString = function() {
  return notOperator() + RegexpMatch.prototype.toString.call(this);
};

RegexpNotMatch.prototype.assert = function() {
  return assertFalse(this.invert());
};

RegexpNotMatch.prototype.verify = function() {
  return verifyFalse(this.invert());
};

function seleniumEquals(type, pattern, expression) {
  if (type == 'String[]') {
    return seleniumEquals('String', pattern.replace(/\\,/g, ','), joinExpression(expression));
  } else if (type == 'String' && pattern.match(/^regexp:/)) {
    return new RegexpMatch(pattern.substring(7), expression);
  } else if (type == 'String' && pattern.match(/^regex:/)) {
    return new RegexpMatch(pattern.substring(6), expression);
  } else if (type == 'String' && (pattern.match(/^glob:/) || pattern.match(/[\*\?]/))) {
    pattern = pattern.replace(/^glob:/, '');
    pattern = pattern.replace(/([\]\[\\\{\}\$\(\).])/g, "\\$1");
    pattern = pattern.replace(/\?/g, "[\\s\\S]");
    pattern = pattern.replace(/\*/g, "[\\s\\S]*");
    return new RegexpMatch("^" + pattern + "$", expression);
  } else {
    pattern = pattern.replace(/^exact:/, '');
    return new Equals(xlateValue(type, pattern), expression);
  }
}

function concatString(array) {
  return array.join(" + ");
}

function toArgumentList(array) {
  return array.join(", ");
}

function keyVariable(key) {
  return variableName(key);
}

this.sendKeysMaping = {};

function xlateKeyVariable(variable) {
  var r;
  if ((r = /^KEY_(.+)$/.exec(variable))) {
    var key = this.sendKeysMaping[r[1]];
    if (key) {
      return keyVariable(key);
    }
  }
  return null;
}

function xlateArgument(value, type) {
  value = value.replace(/^\s+/, '');
  value = value.replace(/\s+$/, '');
  var r;
  var r2;
  var parts = [];
  if ((r = /^javascript\{([\d\D]*)\}$/.exec(value))) {
    var js = r[1];
    var prefix = "";
    while ((r2 = /storedVars\['(.*?)'\]/.exec(js))) {
      parts.push(string(prefix + js.substring(0, r2.index) + "'"));
      parts.push(variableName(r2[1]));
      js = js.substring(r2.index + r2[0].length);
      prefix = "'";
    }
    parts.push(string(prefix + js));
    return new CallSelenium("getEval", [concatString(parts)]);
  } else if ((r = /\$\{/.exec(value))) {
    var regexp = /\$\{(.*?)\}/g;
    var lastIndex = 0;
    while (r2 = regexp.exec(value)) {
      var key = xlateKeyVariable(r2[1]);
      if (key || (this.declaredVars && this.declaredVars[r2[1]])) {
        if (r2.index - lastIndex > 0) {
          parts.push(string(value.substring(lastIndex, r2.index)));
        }
        parts.push(key ? key : variableName(r2[1]));
        lastIndex = regexp.lastIndex;
      } else if (r2[1] == "nbsp") {
        if (r2.index - lastIndex > 0) {
          parts.push(string(value.substring(lastIndex, r2.index)));
        }
        parts.push(nonBreakingSpace());
        lastIndex = regexp.lastIndex;
      }
    }
    if (lastIndex < value.length) {
      parts.push(string(value.substring(lastIndex, value.length)));
    }
    return (type && type.toLowerCase() == 'args') ? toArgumentList(parts) : concatString(parts);
  } else if (type && type.toLowerCase() == 'number') {
    return value;
  } else {
    return string(value);
  }
}

function xlateArrayElement(value) {
  return value.replace(/\\(.)/g, "$1");
}

function xlateValue(type, value) {
  if (type == 'String[]') {
    return array(parseArray(value));
  } else {
    return xlateArgument(value, type);
  }
}

function parseArray(value) {
  var start = 0;
  var list = [];
  for (var i = 0; i < value.length; i++) {
    if (value.charAt(i) == ',') {
      list.push(xlateArrayElement(value.substring(start, i)));
      start = i + 1;
    } else if (value.charAt(i) == '\\') {
      i++;
    }
  }
  list.push(xlateArrayElement(value.substring(start, value.length)));
  return list;
}

function addDeclaredVar(variable) {
  if (this.declaredVars == null) {
    this.declaredVars = {};
  }
  this.declaredVars[variable] = true;
}

function newVariable(prefix, index) {
  if (index == null) index = 1;
  if (this.declaredVars && this.declaredVars[prefix + index]) {
    return newVariable(prefix, index + 1);
  } else {
    addDeclaredVar(prefix + index);
    return prefix + index;
  }
}

function variableName(value) {
  return value;
}

function string(value) {
  if (value != null) {
    //value = value.replace(/^\s+/, '');
    //value = value.replace(/\s+$/, '');
    value = value.replace(/\\/g, '\\\\');
    value = value.replace(/\"/g, '\\"');
    value = value.replace(/\r/g, '\\r');
    value = value.replace(/\n/g, '\\n');
    return '"' + value + '"';
  } else {
    return '""';
  }
}

function CallSelenium(message, args, rawArgs) {
  this.message = message;
  if (args) {
    this.args = args;
  } else {
    this.args = [];
  }
  if (rawArgs) {
    this.rawArgs = rawArgs;
  } else {
    this.rawArgs = [];
  }
}

CallSelenium.prototype.invert = function() {
  var call = new CallSelenium(this.message);
  call.args = this.args;
  call.rawArgs = this.rawArgs;
  call.negative = !this.negative;
  return call;
};

CallSelenium.prototype.toString = function() {
  log.info('Processing ' + this.message);
  if (this.message == 'waitForPageToLoad') {
    return '';
  }
  var result = '';
  var adaptor = new SeleniumWebDriverAdaptor(this.rawArgs);
  if (adaptor[this.message]) {
    var codeBlock = adaptor[this.message].call(adaptor);
    if (adaptor.negative) {
      this.negative = !this.negative;
    }
    if (this.negative) {
      result += notOperator();
    }
    result += codeBlock;
  } else {
    //unsupported
    throw 'ERROR: Unsupported command [' + this.message + ' | ' + (this.rawArgs.length > 0 && this.rawArgs[0] ? this.rawArgs[0] : '') + ' | ' + (this.rawArgs.length > 1 && this.rawArgs[1] ? this.rawArgs[1] : '') + ']';
  }
  return result;
};

function formatCommand(command) {
  var line = null;
  try {
    var call;
    var i;
    var eq;
    var method;
    if (command.type == 'command') {
      var def = command.getDefinition();
      if (def && def.isAccessor) {
        call = new CallSelenium(def.name);
        for (i = 0; i < def.params.length; i++) {
          call.rawArgs.push(command.getParameterAt(i));
          call.args.push(xlateArgument(command.getParameterAt(i)));
        }
        var extraArg = command.getParameterAt(def.params.length);
        if (def.name.match(/^is/)) { // isXXX
          if (command.command.match(/^assert/) ||
              (this.assertOrVerifyFailureOnNext && command.command.match(/^verify/))) {
            line = (def.negative ? assertFalse : assertTrue)(call);
          } else if (command.command.match(/^verify/)) {
            line = (def.negative ? verifyFalse : verifyTrue)(call);
          } else if (command.command.match(/^store/)) {
            addDeclaredVar(extraArg);
            line = statement(assignToVariable('boolean', extraArg, call));
          } else if (command.command.match(/^waitFor/)) {
            line = waitFor(def.negative ? call.invert() : call);
          }
        } else { // getXXX
          if (command.command.match(/^(verify|assert)/)) {
            eq = seleniumEquals(def.returnType, extraArg, call);
            if (def.negative) eq = eq.invert();
            method = (!this.assertOrVerifyFailureOnNext && command.command.match(/^verify/)) ? 'verify' : 'assert';
            line = eq[method]();
          } else if (command.command.match(/^store/)) {
            addDeclaredVar(extraArg);
            line = statement(assignToVariable(def.returnType, extraArg, call));
          } else if (command.command.match(/^waitFor/)) {
            eq = seleniumEquals(def.returnType, extraArg, call);
            if (def.negative) eq = eq.invert();
            line = waitFor(eq);
          }
        }
      } else if (this.pause && 'pause' == command.command) {
        line = pause(command.target);
      } else if (this.echo && 'echo' == command.command) {
        line = echo(command.target);
      } else if ('store' == command.command) {
        addDeclaredVar(command.value);
        line = statement(assignToVariable('String', command.value, xlateArgument(command.target)));
      } else if (this.set && command.command.match(/^set/)) {
        line = set(command.command, command.target);
      } else if (command.command.match(/^(assert|verify)Selected$/)) {
        var optionLocator = command.value;
        var flavor = 'Label';
        var value = optionLocator;
        var r = /^(index|label|value|id)=(.*)$/.exec(optionLocator);
        if (r) {
          flavor = r[1].replace(/^[a-z]/, function(str) {
            return str.toUpperCase()
          });
          value = r[2];
        }
        method = (!this.assertOrVerifyFailureOnNext && command.command.match(/^verify/)) ? 'verify' : 'assert';
        call = new CallSelenium("getSelected" + flavor);
        call.rawArgs.push(command.target);
        call.args.push(xlateArgument(command.target));
        eq = seleniumEquals('String', value, call);
        line = statement(eq[method]());
      } else if (def) {
        if (def.name.match(/^(assert|verify)(Error|Failure)OnNext$/)) {
          this.assertOrVerifyFailureOnNext = true;
          this.assertFailureOnNext = def.name.match(/^assert/);
          this.verifyFailureOnNext = def.name.match(/^verify/);
        } else {
          call = new CallSelenium(def.name);
          if ("open" == def.name && options.urlSuffix && !command.target.match(/^\w+:\/\//)) {
            // urlSuffix is used to translate core-based test
            call.rawArgs.push(options.urlSuffix + command.target);
            call.args.push(xlateArgument(options.urlSuffix + command.target));
          } else {
            for (i = 0; i < def.params.length; i++) {
              call.rawArgs.push(command.getParameterAt(i));
              call.args.push(xlateArgument(command.getParameterAt(i)));
            }
          }
          line = statement(call, command);
        }
      } else {
        this.log.info("unknown command: <" + command.command + ">");
        throw 'unknown command [' + command.command + ']';
      }
    }
  } catch(e) {
    this.log.error("Caught exception: [" + e + "]");
    // TODO
//    var call = new CallSelenium(command.command);
//    if ((command.target != null && command.target.length > 0)
//        || (command.value != null && command.value.length > 0)) {
//      call.rawArgs.push(command.target);
//      call.args.push(string(command.target));
//      if (command.value != null && command.value.length > 0) {
//        call.rawArgs.push(command.value);
//        call.args.push(string(command.value));
//      }
//    }
//    line = formatComment(new Comment(statement(call)));
    line = formatComment(new Comment('ERROR: Caught exception [' + e + ']'));
  }
  if (line && this.assertOrVerifyFailureOnNext) {
    line = assertOrVerifyFailure(line, this.assertFailureOnNext);
    this.assertOrVerifyFailureOnNext = false;
    this.assertFailureOnNext = false;
    this.verifyFailureOnNext = false;
  }
  //TODO: convert array to newline separated string -> if(array) return array.join"\n"
  if (command.type == 'command' && options.showSelenese && options.showSelenese == 'true') {
    if (command.remapped) {
      line = formatComment(new Comment(command.remapped.command + ' | ' + command.remapped.target + ' | ' + command.remapped.value)) + "\n" + line;
    } else {
      line = formatComment(new Comment(command.command + ' | ' + command.target + ' | ' + command.value)) + "\n" + line;
    }
  }
  return line;
}

this.remoteControl = true;
this.playable = false;

function SeleniumWebDriverAdaptor(rawArgs) {
  this.rawArgs = rawArgs;
  this.negative = false;
}

// Returns locator.type and locator.string
SeleniumWebDriverAdaptor.prototype._elementLocator = function(sel1Locator) {
  var locator = parse_locator(sel1Locator);
  if (sel1Locator.match(/^\/\//) || locator.type == 'xpath') {
    locator.type = 'xpath';
    return locator;
  }
  if (locator.type == 'css') {
    return locator;
  }
  if (locator.type == 'id') {
    return locator;
  }
  if (locator.type == 'link') {
    locator.string = locator.string.replace(/^exact:/, '');
    return locator;
  }
  if (locator.type == 'name') {
    return locator;
  }
  if (locator.type == 'relative') {
    return locator;
  } 
  if (sel1Locator.match(/^document/) || locator.type == 'dom') {
    throw 'Error: Dom locators are not implemented yet!';
  }
  if (locator.type == 'ui') {
    throw 'Error: UI locators are not supported!';
  }
  if (locator.type == 'identifier') {
    throw 'Error: locator strategy [identifier] has been deprecated. To rectify specify the correct locator strategy id or name explicitly.';
  }
  if (locator.type == 'implicit') {
    throw 'Error: locator strategy either id or name must be specified explicitly.';
  }
  throw 'Error: unknown strategy [' + locator.type + '] for locator [' + sel1Locator + ']';
};

// Returns locator.elementLocator and locator.attributeName
SeleniumWebDriverAdaptor.prototype._attributeLocator = function(sel1Locator) {
  var attributePos = sel1Locator.lastIndexOf("@");
  var elementLocator = sel1Locator.slice(0, attributePos);
  var attributeName = sel1Locator.slice(attributePos + 1);
  return {elementLocator: elementLocator, attributeName: attributeName};
};

SeleniumWebDriverAdaptor.prototype._selectLocator = function(sel1Locator) {
  //Figure out which strategy to use
  var locator = {type: 'label', string: sel1Locator};
  // If there is a locator prefix, use the specified strategy
  var result = sel1Locator.match(/^([a-zA-Z]+)=(.*)/);
  if (result) {
    locator.type = result[1];
    locator.string = result[2];
  }
  //alert(locatorType + ' [' + locatorValue + ']');
  if (locator.type == 'index') {
    return locator;
  }
  if (locator.type == 'label') {
    return locator;
  }
  if (locator.type == 'value') {
    return locator;
  }
  throw 'Error: unknown or unsupported strategy [' + locator.type + '] for locator [' + sel1Locator + ']';
};

// Returns an object with a toString method
SeleniumWebDriverAdaptor.SimpleExpression = function(expressionString) {
  this.str = expressionString;
};

SeleniumWebDriverAdaptor.SimpleExpression.prototype.toString = function() {
  return this.str;
};

//helper method to simplify the ifCondition
SeleniumWebDriverAdaptor.ifCondition = function(conditionString, stmtString) {
  return ifCondition(new SeleniumWebDriverAdaptor.SimpleExpression(conditionString), function() {
    return statement(new SeleniumWebDriverAdaptor.SimpleExpression(stmtString)) + "\n";
  });
};

SeleniumWebDriverAdaptor.prototype.check = function(elementLocator) {
  var locator = this._elementLocator(this.rawArgs[0]);
  var driver = new WDAPI.Driver();
  var webElement = driver.findElement(locator.type, locator.string);
  return SeleniumWebDriverAdaptor.ifCondition(notOperator() + webElement.isSelected(),
    indents(1) + webElement.click()
  );
};

SeleniumWebDriverAdaptor.prototype.click = function(elementLocator) {
  var locator = this._elementLocator(this.rawArgs[0]);
  var driver = new WDAPI.Driver();
  return driver.findElement(locator.type, locator.string).click();
};

SeleniumWebDriverAdaptor.prototype.close = function() {
  var driver = new WDAPI.Driver();
  return driver.close();
};

SeleniumWebDriverAdaptor.prototype.getAttribute = function(attributeLocator) {
  var attrLocator = this._attributeLocator(this.rawArgs[0]);
  var locator = this._elementLocator(attrLocator.elementLocator);
  var driver = new WDAPI.Driver();
  var webElement = driver.findElement(locator.type, locator.string);
  return webElement.getAttribute(attrLocator.attributeName);
};

SeleniumWebDriverAdaptor.prototype.getBodyText = function() {
  var driver = new WDAPI.Driver();
  return driver.findElement('tag_name', 'BODY').getText();
};

SeleniumWebDriverAdaptor.prototype.getCssCount = function(elementLocator) {
  var locator = this._elementLocator(this.rawArgs[0]);
  var driver = new WDAPI.Driver();
  return driver.findElements(locator.type, locator.string).getSize();
};

SeleniumWebDriverAdaptor.prototype.getLocation = function() {
  var driver = new WDAPI.Driver();
  return driver.getCurrentUrl();
};

SeleniumWebDriverAdaptor.prototype.getText = function(elementLocator) {
  var locator = this._elementLocator(this.rawArgs[0]);
  var driver = new WDAPI.Driver();
  return driver.findElement(locator.type, locator.string).getText();
};

SeleniumWebDriverAdaptor.prototype.getTitle = function() {
  var driver = new WDAPI.Driver();
  return driver.getTitle();
};

SeleniumWebDriverAdaptor.prototype.getAlert = function() {
  var driver = new WDAPI.Driver();
  return driver.getAlert();
};

SeleniumWebDriverAdaptor.prototype.isAlertPresent = function() {
  return WDAPI.Utils.isAlertPresent();
};

SeleniumWebDriverAdaptor.prototype.getConfirmation = function() {
  var driver = new WDAPI.Driver();
  return driver.getAlert();
};

SeleniumWebDriverAdaptor.prototype.isConfirmationPresent = function() {
  return WDAPI.Utils.isAlertPresent();
};

SeleniumWebDriverAdaptor.prototype.chooseOkOnNextConfirmation = function() {
  var driver = new WDAPI.Driver();
  return driver.chooseOkOnNextConfirmation();
};

SeleniumWebDriverAdaptor.prototype.chooseCancelOnNextConfirmation = function() {
  var driver = new WDAPI.Driver();
  return driver.chooseCancelOnNextConfirmation();
};

SeleniumWebDriverAdaptor.prototype.getValue = function(elementLocator) {
  var locator = this._elementLocator(this.rawArgs[0]);
  var driver = new WDAPI.Driver();
  return driver.findElement(locator.type, locator.string).getAttribute('value');
};

SeleniumWebDriverAdaptor.prototype.getXpathCount = function(elementLocator) {
  var locator = this._elementLocator(this.rawArgs[0]);
  var driver = new WDAPI.Driver();
  return driver.findElements(locator.type, locator.string).getSize();
};

SeleniumWebDriverAdaptor.prototype.goBack = function() {
  var driver = new WDAPI.Driver();
  return driver.back();
};

SeleniumWebDriverAdaptor.prototype.isChecked = function(elementLocator) {
  var locator = this._elementLocator(this.rawArgs[0]);
  var driver = new WDAPI.Driver();
  return driver.findElement(locator.type, locator.string).isSelected();
};

SeleniumWebDriverAdaptor.prototype.isElementPresent = function(elementLocator) {
  var locator = this._elementLocator(this.rawArgs[0]);
  //var driver = new WDAPI.Driver();
  //TODO: enough to just find element, but since this is an accessor, we will need to make a not null comparison
  //return driver.findElement(locator.type, locator.string);
  return WDAPI.Utils.isElementPresent(locator.type, locator.string);
};

SeleniumWebDriverAdaptor.prototype.isVisible = function(elementLocator) {
  var locator = this._elementLocator(this.rawArgs[0]);
  var driver = new WDAPI.Driver();
  return driver.findElement(locator.type, locator.string).isDisplayed();
};

SeleniumWebDriverAdaptor.prototype.open = function(url) {
  //TODO process the relative and absolute urls
  var absUrl = xlateArgument(this.rawArgs[0]);
  var driver = new WDAPI.Driver();
  return driver.get(absUrl);
};

SeleniumWebDriverAdaptor.prototype.refresh = function() {
  var driver = new WDAPI.Driver();
  return driver.refresh();
};

SeleniumWebDriverAdaptor.prototype.submit = function(elementLocator) {
  var locator = this._elementLocator(this.rawArgs[0]);
  var driver = new WDAPI.Driver();
  return driver.findElement(locator.type, locator.string).submit();
};

SeleniumWebDriverAdaptor.prototype.type = function(elementLocator, text) {
  var locator = this._elementLocator(this.rawArgs[0]);
  var driver = new WDAPI.Driver();
  var webElement = driver.findElement(locator.type, locator.string);
  return statement(new SeleniumWebDriverAdaptor.SimpleExpression(webElement.clear())) + "\n" + webElement.sendKeys(this.rawArgs[1]);
};

SeleniumWebDriverAdaptor.prototype.sendKeys = function(elementLocator, text) {
  var locator = this._elementLocator(this.rawArgs[0]);
  var driver = new WDAPI.Driver();
  return driver.findElement(locator.type, locator.string).sendKeys(this.rawArgs[1]);
};

SeleniumWebDriverAdaptor.prototype.uncheck = function(elementLocator) {
  var locator = this._elementLocator(this.rawArgs[0]);
  var driver = new WDAPI.Driver();
  var webElement = driver.findElement(locator.type, locator.string);
  return SeleniumWebDriverAdaptor.ifCondition(webElement.isSelected(),
    indents(1) + webElement.click()
  );
};

SeleniumWebDriverAdaptor.prototype.select = function(elementLocator, label) {
  var locator = this._elementLocator(this.rawArgs[0]);
  var driver = new WDAPI.Driver();
  return driver.findElement(locator.type, locator.string).select(this._selectLocator(this.rawArgs[1]));
};

SeleniumWebDriverAdaptor.prototype.selectFrame = function(elementLocator) {
  var locator = this._elementLocator(this.rawArgs[0]);
  var driver = new WDAPI.Driver();
  return driver.selectFrame(locator.type, locator.string)
};

SeleniumWebDriverAdaptor.prototype.selectWindow = function(elementLocator) {

  var driver = new WDAPI.Driver();
  
  if (this.rawArgs[0] === 'null'){
    return driver.selectWindow(this.rawArgs[0], this.rawArgs[0]);
  }
  
  var locator = this._elementLocator(this.rawArgs[0]);
  return driver.selectWindow(locator.type, locator.string)
};

//SeleniumWebDriverAdaptor.prototype.isSomethingSelected = function(elementLocator) {
////  var locator = this._elementLocator(this.rawArgs[0]);
////  var driver = new WDAPI.Driver();
////  var webElement = driver.findElement(locator.type, locator.string);
////  return ifCondition(new SeleniumWebDriverAdaptor.SimpleExpression(webElement.isSelected()), function() { return indents(1) + webElement.click() + "\n";} );
////  if (this.args.length != 1) {
////    alert("Arguments for " + this.message + " is not 1, received " + this.args.length);
////    //TODO show the arguments
////  } else {
////    result += 'findElement(';
////    result += this.elementLocator();
////    result += ')';
////    var sel = 'new Select(' + result + ')';
////    result = sel + '.getAllSelectedOptions().isEmpty()';
////    return '!' + result;
////  }
//};
//
//SeleniumWebDriverAdaptor.prototype.isSomethingSelected = function(elementLocator) {
////  var locator = this._elementLocator(this.rawArgs[0]);
////  var driver = new WDAPI.Driver();
////  var webElement = driver.findElement(locator.type, locator.string);
////  return ifCondition(new SeleniumWebDriverAdaptor.SimpleExpression(webElement.isSelected()), function() { return indents(1) + webElement.click() + "\n";} );
////  if (this.args.length != 2) {
////    alert("Arguments for " + this.message + " is not 2, received " + this.args.length);
////    //TODO show the arguments
////  } else {
////    result += 'findElement(';
////    result += this.elementLocator();
////    result += ')';
////    var sel = 'new Select(' + result + ')';
////    result = sel + '.deselectAll();\n';
////    result += sel + this.selectLocator();
////    return result;
////  }
//};

function WDAPI() {
}


/*
 * Formatter for Selenium 2 / WebDriver Python client.
 */


function testClassName(testName) {
  return testName.split(/[^0-9A-Za-z]+/).map(
      function(x) {
        return capitalize(x);
      }).join('');
}

function testMethodName(testName) {
  return "test_" + testName.split(/[^0-9A-Za-z]+/).map(
      function(x) {
        return underscore(x);
      }).join('');
  //return "test_" + underscore(testName);
}

function nonBreakingSpace() {
  return "u\"\\u00a0\"";
}

function string(value) {
  value = value.replace(/\\/g, '\\\\');
  value = value.replace(/\"/g, '\\"');
  value = value.replace(/\r/g, '\\r');
  value = value.replace(/\n/g, '\\n');
  var unicode = false;
  for (var i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) >= 128) {
      unicode = true;
    }
  }
  return (unicode ? 'u' : '') + '"' + value + '"';
}

function array(value) {
  var str = '[';
  for (var i = 0; i < value.length; i++) {
    str += string(value[i]);
    if (i < value.length - 1) str += ", ";
  }
  str += ']';
  return str;
}

notOperator = function() {
  return "not ";
};

Equals.prototype.toString = function() {
  return this.e1.toString() + " == " + this.e2.toString();
};

Equals.prototype.assert = function() {
  return "self.assertEqual(" + this.e1.toString() + ", " + this.e2.toString() + ")";
};

Equals.prototype.verify = function() {
  return verify(this.assert());
};

NotEquals.prototype.toString = function() {
  return this.e1.toString() + " != " + this.e2.toString();
};

NotEquals.prototype.assert = function() {
  return "self.assertNotEqual(" + this.e1.toString() + ", " + this.e2.toString() + ")";
};

NotEquals.prototype.verify = function() {
  return verify(this.assert());
};

function joinExpression(expression) {
  return "','.join(" + expression.toString() + ")";
}

function statement(expression) {
  return expression.toString();
}

function assignToVariable(type, variable, expression) {
  return variable + " = " + expression.toString();
}

function ifCondition(expression, callback) {
  var blk = callback().replace(/\n$/m,'');
  return "if " + expression.toString() + ":\n" + blk;
}

function assertTrue(expression) {
  return "self.assertTrue(" + expression.toString() + ")";
}

function assertFalse(expression) {
  return "self.assertFalse(" + expression.toString() + ")";
}

function verify(statement) {
  return "try: " + statement + "\n" +
      "except AssertionError as e: self.verificationErrors.append(str(e))";
}

function verifyTrue(expression) {
  return verify(assertTrue(expression));
}

function verifyFalse(expression) {
  return verify(assertFalse(expression));
}

RegexpMatch.patternAsRawString = function(pattern) {
  var str = pattern;
  if (str.match(/\"/) || str.match(/\n/)) {
    str = str.replace(/\\/g, "\\\\");
    str = str.replace(/\"/g, '\\"');
    str = str.replace(/\n/g, '\\n');
    return '"' + str + '"';
  } else {
    return str = 'r"' + str + '"';
  }
};

RegexpMatch.prototype.patternAsRawString = function() {
  return RegexpMatch.patternAsRawString(this.pattern);
};

RegexpMatch.prototype.toString = function() {
  var str = this.pattern;
  if (str.match(/\"/) || str.match(/\n/)) {
    str = str.replace(/\\/g, "\\\\");
    str = str.replace(/\"/g, '\\"');
    str = str.replace(/\n/g, '\\n');
    return '"' + str + '"';
  } else {
    str = 'r"' + str + '"';
  }
  return "re.search(" + str + ", " + this.expression + ")";
};

RegexpMatch.prototype.assert = function() {
  return 'self.assertRegexpMatches(' + this.expression + ", " + this.patternAsRawString() + ")";
};

RegexpMatch.prototype.verify = function() {
  return verify(this.assert());
};

RegexpNotMatch.prototype.patternAsRawString = function() {
  return RegexpMatch.patternAsRawString(this.pattern);
};

RegexpNotMatch.prototype.assert = function() {
  return 'self.assertNotRegexpMatches(' + this.expression + ", " + this.patternAsRawString() + ")";
};

RegexpNotMatch.prototype.verify = function() {
  return verify(this.assert());
};

function waitFor(expression) {
  return "for i in range(60):\n" +
      indents(1) + "try:\n" +
      indents(2) + "if " + expression.toString() + ": break\n" +
      indents(1) + "except: pass\n" +
      indents(1) + 'time.sleep(1)\n' +
      'else: self.fail("time out")';
}

function assertOrVerifyFailure(line, isAssert) {
  return "try: " + line + "\n" +
      "except: pass\n" +
      'else: self.fail("expected failure")';
}

function pause(milliseconds) {
  return "time.sleep(" + (parseInt(milliseconds, 10) / 1000) + ")";
}

function echo(message) {
  return "print(" + xlateArgument(message) + ")";
}

function formatComment(comment) {
  return comment.comment.replace(/.+/mg, function(str) {
    return "# " + str;
  });
}

function keyVariable(key) {
  return "Keys." + key;
}

this.sendKeysMaping = {
  BKSP: "BACK_SPACE",
  BACKSPACE: "BACK_SPACE",
  TAB: "TAB",
  ENTER: "ENTER",
  SHIFT: "SHIFT",
  CONTROL: "CONTROL",
  CTRL: "CONTROL",
  ALT: "ALT",
  PAUSE: "PAUSE",
  ESCAPE: "ESCAPE",
  ESC: "ESCAPE",
  SPACE: "SPACE",
  PAGE_UP: "PAGE_UP",
  PGUP: "PAGE_UP",
  PAGE_DOWN: "PAGE_DOWN",
  PGDN: "PAGE_DOWN",
  END: "END",
  HOME: "HOME",
  LEFT: "LEFT",
  UP: "UP",
  RIGHT: "RIGHT",
  DOWN: "DOWN",
  INSERT: "INSERT",
  INS: "INSERT",
  DELETE: "DELETE",
  DEL: "DELETE",
  SEMICOLON: "SEMICOLON",
  EQUALS: "EQUALS",

  NUMPAD0: "NUMPAD0",
  N0: "NUMPAD0",
  NUMPAD1: "NUMPAD1",
  N1: "NUMPAD1",
  NUMPAD2: "NUMPAD2",
  N2: "NUMPAD2",
  NUMPAD3: "NUMPAD3",
  N3: "NUMPAD3",
  NUMPAD4: "NUMPAD4",
  N4: "NUMPAD4",
  NUMPAD5: "NUMPAD5",
  N5: "NUMPAD5",
  NUMPAD6: "NUMPAD6",
  N6: "NUMPAD6",
  NUMPAD7: "NUMPAD7",
  N7: "NUMPAD7",
  NUMPAD8: "NUMPAD8",
  N8: "NUMPAD8",
  NUMPAD9: "NUMPAD9",
  N9: "NUMPAD9",
  MULTIPLY: "MULTIPLY",
  MUL: "MULTIPLY",
  ADD: "ADD",
  PLUS: "ADD",
  SEPARATOR: "SEPARATOR",
  SEP: "SEPARATOR",
  SUBTRACT: "SUBTRACT",
  MINUS: "SUBTRACT",
  DECIMAL: "DECIMAL",
  PERIOD: "DECIMAL",
  DIVIDE: "DIVIDE",
  DIV: "DIVIDE",

  F1: "F1",
  F2: "F2",
  F3: "F3",
  F4: "F4",
  F5: "F5",
  F6: "F6",
  F7: "F7",
  F8: "F8",
  F9: "F9",
  F10: "F10",
  F11: "F11",
  F12: "F12",

  META: "META",
  COMMAND: "COMMAND"
};

function defaultExtension() {
  return this.options.defaultExtension;
}

this.options = {
  receiver: "wrapper",
  showSelenese: 'false',
  rcHost: "localhost",
  rcPort: "4444",
  environment: "*chrome",
  header:
      '# -*- coding: utf-8 -*-\n' +
          'from data.exploits.base.BasicExploit import BasicExploit\n' +
          'from settings import mapped_port_host\n\n' +
          'class Exploit(BasicExploit):\n\n' +
          '    attributes = {\n'+
          '        "Name" : "Nodegoat_login",\n' +
          '        "Description" : "",\n' +
          '        "Target" : "nodegoat",\n' +
          '        "Container" : "ubuntu-node-mongo",\n' +
          '        "Type" : ""\n' +
          '    }\n\n' +
          '    def runExploit(self):\n' +
          '        self.base_url = "${baseURL}"\n' +
          '        if self.base_url.endswith("/"):\n' +
          '            self.base_url = self.base_url[:-1]\n' +
          '        wrapper = self.wrapper\n',
  footer:
      '    \n',
  indent:  '4',
  initialIndents: '2',
  defaultExtension: "py"
};

this.configForm =
    '<description>Variable for Selenium instance</description>' +
        '<textbox id="options_receiver" />' +
        '<description>Selenium RC host</description>' +
        '<textbox id="options_rcHost" />' +
        '<description>Selenium RC port</description>' +
        '<textbox id="options_rcPort" />' +
        '<description>Environment</description>' +
        '<textbox id="options_environment" />' +
        '<description>Header</description>' +
        '<textbox id="options_header" multiline="true" flex="1" rows="4"/>' +
        '<description>Footer</description>' +
        '<textbox id="options_footer" multiline="true" flex="1" rows="4"/>' +
        '<description>Indent</description>' +
        '<menulist id="options_indent"><menupopup>' +
        '<menuitem label="Tab" value="tab"/>' +
        '<menuitem label="1 space" value="1"/>' +
        '<menuitem label="2 spaces" value="2"/>' +
        '<menuitem label="3 spaces" value="3"/>' +
        '<menuitem label="4 spaces" value="4"/>' +
        '<menuitem label="5 spaces" value="5"/>' +
        '<menuitem label="6 spaces" value="6"/>' +
        '<menuitem label="7 spaces" value="7"/>' +
        '<menuitem label="8 spaces" value="8"/>' +
        '</menupopup></menulist>' +
        '<checkbox id="options_showSelenese" label="Show Selenese"/>';

this.name = "Python (WebDriver)";
this.testcaseExtension = ".py";
this.suiteExtension = ".py";
this.webdriver = true;

WDAPI.Driver = function() {
  this.ref = options.receiver;
};

WDAPI.Driver.searchContext = function(locatorType, locator) {
  var locatorString = xlateArgument(locator);
  switch (locatorType) {
    case 'xpath':
      return '_by_xpath(' + locatorString;
    case 'css':
      return '_by_css_selector(' + locatorString;
    case 'id':
      return '_by_id(' + locatorString;
    case 'link':
      return '_by_link_text(' + locatorString;
    case 'name':
      return '_by_name(' + locatorString;
    case 'tag_name':
      return '_by_tag_name(' + locatorString;
  }
  throw 'Error: unknown strategy [' + locatorType + '] for locator [' + locator + ']';
};

WDAPI.Driver.searchContextArgs = function(locatorType, locator) {
  var locatorString = xlateArgument(locator);
  switch (locatorType) {
    case 'xpath':
      return 'By.XPATH, ' + locatorString;
    case 'css':
      return 'By.CSS_SELECTOR, ' + locatorString;
    case 'id':
      return 'By.ID, ' + locatorString;
    case 'link':
      return 'By.LINK_TEXT, ' + locatorString;
    case 'name':
      return 'By.NAME, ' + locatorString;
    case 'tag_name':
      return 'By.TAG_NAME, ' + locatorString;
  }
  throw 'Error: unknown strategy [' + locatorType + '] for locator [' + locator + ']';
};

WDAPI.Driver.prototype.back = function() {
  return this.ref + ".back()";
};

WDAPI.Driver.prototype.close = function() {
  return this.ref + ".close()";
};

WDAPI.Driver.prototype.selectFrame = function(locatorType, locator) {
  var locatorString = xlateArgument(locator);
  return 'wrapper.switchToframe(' + locatorString +')' ;
  //return this.ref + ".selectFrame()";
};

WDAPI.Driver.prototype.selectWindow = function(locatorType, locator) {
  var locatorString = xlateArgument(locator);
  return 'wrapper.selectWindow(' + locatorString + ')' ;
};


WDAPI.Driver.prototype.findElement = function(locatorType, locator) {
  var locatorString = xlateArgument(locator);
  return new WDAPI.Element(this.ref + ".find" + "(" + locatorString + ")");
};

WDAPI.Driver.prototype.findElements = function(locatorType, locator) {
  return new WDAPI.ElementList(this.ref + ".find_elements" + WDAPI.Driver.searchContext(locatorType, locator) + ")");
};

WDAPI.Driver.prototype.getCurrentUrl = function() {
  return this.ref + ".current_url";
};

WDAPI.Driver.prototype.get = function(url) {
  if (url.length > 1 && (url.substring(1,8) == "http://" || url.substring(1,9) == "https://")) { // url is quoted
    return this.ref + ".navigate(" + url + ")";
  } else {
    return this.ref + ".navigate(self.base_url + " + url + ")";
  }
};

WDAPI.Driver.prototype.getTitle = function() {
  return this.ref + ".title";
};

WDAPI.Driver.prototype.getAlert = function() {
  return "wrapper.get_alert_text()";
};

WDAPI.Driver.prototype.refresh = function() {
  return this.ref + ".refresh()";
};

WDAPI.Element = function(ref) {
  this.ref = ref;
};

WDAPI.Element.prototype.clear = function() {
  return this.ref + ".clear()";
};

WDAPI.Element.prototype.click = function() {
  return this.ref + ".click()";
};

WDAPI.Element.prototype.getAttribute = function(attributeName) {
  return this.ref + ".get_attribute(" + xlateArgument(attributeName) + ")";
};

WDAPI.Element.prototype.getText = function() {
  return this.ref + ".text";
};

WDAPI.Element.prototype.isDisplayed = function() {
  return this.ref + ".is_displayed()";
};

WDAPI.Element.prototype.isSelected = function() {
  return this.ref + ".is_selected()";
};

WDAPI.Element.prototype.sendKeys = function(text) {
  return this.ref + ".keys(" + xlateArgument(text, 'args') + ")";
};

WDAPI.Element.prototype.submit = function() {
  return this.ref + ".submit()";
};

WDAPI.Element.prototype.select = function(selectLocator) {
  if (selectLocator.type == 'index') {
    return "Select(" + this.ref + ").select_by_index(" + selectLocator.string + ")";
  }
  if (selectLocator.type == 'value') {
    return "Select(" + this.ref + ").select_by_value(" + xlateArgument(selectLocator.string) + ")";
  }
  return "Select(" + this.ref + ").select_by_visible_text(" + xlateArgument(selectLocator.string) + ")";
};

WDAPI.ElementList = function(ref) {
  this.ref = ref;
};

WDAPI.ElementList.prototype.getItem = function(index) {
  return this.ref + "[" + index + "]";
};

WDAPI.ElementList.prototype.getSize = function() {
  return 'len(' + this.ref + ")";
};

WDAPI.ElementList.prototype.isEmpty = function() {
  return 'len(' + this.ref + ") == 0";
};


WDAPI.Utils = function() {
};

WDAPI.Utils.isElementPresent = function(how, what) {
  return "wrapper.is_element_present(" + WDAPI.Driver.searchContextArgs(how, what) + ")";
};

WDAPI.Utils.isAlertPresent = function() {
  return "wrapper.alert_is_present()";
};
