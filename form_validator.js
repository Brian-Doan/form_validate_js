/* 
  Tư duy theo kiểu thư viện --> có thể dùng trong nhiều form khác nhau, chỉ cần chỉnh sửa lại một số chỗ cho phù hợp nhiệm vụ
*/

// Constructor Function - đối tượng 'Validator'
function Validator(options) {
  // Hàm để lấy parent element của một element bị lồng nhiều cấp
  function getParent(element, selector) {
    while (element.parentNode) {
      if (element.parentNode.matches(selector)) {
        return element.parentNode;
      }
      // Nếu không tìm thấy parent element khớp với selector
      // thì gán element bằng chính parent của nó
      element = element.parentNode;
    }
  }

  var selectorRules = {};

  // Hàm thực hiện validate
  function validate(inputElement, rule) {
    // value --> inputElement.value
    // test function --> rule.test
    var inputParentElement = getParent(inputElement, options.formGroupSelector);
    var errorElement = inputParentElement.querySelector(options.errorSelector);
    var errorMessage;

    // Lấy ra các rules của selector
    var rules = selectorRules[rule.selector];

    // Lặp qua từng rule của selector và kiểm tra
    // Nếu có lỗi thì dừng (break) việc kiểm tra
    for (var i = 0; i < rules.length; i++) {
      // Dùng switch để kiểm tra trường hợp input kiểu checkbox hoặc radio
      switch (inputElement.type) {
        case "radio":
        case "checkbox":
          errorMessage = rules[i](
            formElement.querySelector(rule.selector + ":checked")
          );
          break;
        default:
          errorMessage = rules[i](inputElement.value);
      }
      if (errorMessage) {
        break;
      }
    }

    if (errorMessage) {
      errorElement.innerText = errorMessage;
      inputParentElement.classList.add("invalid");
    } else {
      errorElement.innerText = "";
      inputParentElement.classList.remove("invalid");
    }

    return !errorMessage;
  }

  // Hàm thực hiện validate cho ô input Email
  function emailValidate(inputElement) {
    var inputParentElement = getParent(inputElement, options.formGroupSelector);
    var errorElement = inputParentElement.querySelector(".form-message");

    errorElement.innerText = "";
    inputParentElement.classList.remove("invalid");
  }

  // Lấy element của form cần validate
  var formElement = document.querySelector(options.form);
  if (formElement) {
    // Bỏ hành vi submit mặc định của form
    formElement.onsubmit = function (e) {
      e.preventDefault();

      var isFormValid = true;

      options.rules.forEach(function (rule) {
        var inputElement = formElement.querySelector(rule.selector);
        var isValid = validate(inputElement, rule);

        if (!isValid) {
          isFormValid = false;
        }
      });

      if (isFormValid) {
        // Trường hợp sử dụng submit với javascript
        if (typeof options.onSubmit === "function") {
          var enableInputs = formElement.querySelectorAll(
            "[name]:not([disabled])"
          );
          var formValues = Array.from(enableInputs).reduce(function (
            values,
            input
          ) {
            // Xét từng trường hợp kiểu input khác nhau
            switch (input.type) {
              case "radio":
                values[input.name] = formElement.querySelector(
                  'input[name="' + input.name + '"]:checked'
                  ).value
                  break;
              case "checkbox":
                if (!input.matches(':checked')) {
                  return values
                }
                // Vì checkbox cho phép chọn nhiều nên đưa
                // value vào một mảng để nhận 
                if (!Array.isArray(values[input.name])) {
                  values[input.name] = []
                }
                values[input.name].push(input.value)
                break
              case 'file':
                values[input.name] = input.files
                break
              default:
                values[input.name] = input.value;
            }
            return values;
          },
          {});

          options.onSubmit(formValues);
        }
        // Trường hợp sử dụng submit mặc định của trình duyệt
        else {
          formElement.submit();
        }
      } else {
        console.log("Form có lỗi");
      }
    };

    // Lặp qua mỗi rule và xử lý sự kiện (blur, input,...)
    options.rules.forEach(function (rule) {
      // Lưu lại các rules trong mỗi input
      if (Array.isArray(selectorRules[rule.selector])) {
        selectorRules[rule.selector].push(rule.test);
      } else {
        selectorRules[rule.selector] = [rule.test];
      }

      var inputElements = formElement.querySelectorAll(rule.selector);

      Array.from(inputElements).forEach(function (inputElement) {
        // Xử lý thông báo lỗi khi blur khỏi input
        inputElement.onblur = function () {
          validate(inputElement, rule);
        };

        // Xử lý mỗi khi user nhập input thì ẩn lỗi
        inputElement.oninput = function () {
          emailValidate(inputElement);
        };
      });
    });
  }
}

/* Về bản chất, function cũng tương tự một object
  nên có thể tạo phương thức theo cách trực tiếp như này */
/* Nguyên tắc chung của các rules:
  1. Khi có lỗi --> trả về message lỗi
  2. Khi hợp lệ --> trả về undefined
*/
Validator.isRequired = function (selector, message) {
  return {
    selector: selector,
    test: function (value) {
      return value ? undefined : message || "Vui lòng nhập trường này";
    },
  };
};

Validator.isEmail = function (selector, message) {
  return {
    selector: selector,
    test: function (value) {
      var emailRegEx =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

      return emailRegEx.test(value)
        ? undefined
        : message || "Trường này phải là Email";
    },
  };
};

Validator.isPassword = function (selector, minLength, message) {
  return {
    selector: selector,
    test: function (value) {
      return value.length >= minLength
        ? undefined
        : message || `Vui lòng nhập tối thiểu ${minLength} kí tự`;
    },
  };
};

Validator.isConfirmPassword = function (
  selector,
  getConfirmPasswordValue,
  message
) {
  return {
    selector: selector,
    test: function (value) {
      return value === getConfirmPasswordValue()
        ? undefined
        : message || "Giá trị nhập vào không chính xác";
    },
  };
};
