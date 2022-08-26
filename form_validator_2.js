function Validator(formSelector) {

    var _this = this
    var formRules = {}

    function getParent(element, selector) {
        while (element.parentNode) {
            if (element.parentNode.matches(selector)) {
                return element.parentNode
            }
            element = element.parentNode
        }
    }
    
    /**
     * Quy ước tạo rules khi validate form
     * 1. Nếu có lỗi thì trả về error message
     * 2. Nếu không có lỗi thì trả về undefined
     */
    var validatorRules = {
        required: function(value) {
            return value ? undefined : 'Vui lòng nhập trường này'
        },
        email: function(value) {
            var emailRegEx = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
            return emailRegEx.test(value) ? undefined : 'Vui lòng nhập email'
        },
        min: function(minLength) {
            return function (value) {
                return value.length >= minLength ? undefined : `Vui lòng nhập ít nhất ${minLength} kí tự`
            }
        },
        confirm: function(value) {
            return document.querySelector("#register-form #password").value === value ? undefined : 'Mật khẩu nhập lại không chính xác'
        }
    }

    // Lấy form cụ thể theo form selector
    var formElement = document.querySelector(formSelector)

    if (formElement) {
        var inputElements = formElement.querySelectorAll('[name][rules]')

        // Duyệt qua từng input
        for (var input of inputElements) {
            var rules = input.getAttribute('rules').split('|')
            for (var rule of rules) {
                var inputLengthRule
                var isRuleHasValue = rule.includes(':')

                // Xử lý các rule xác định min và max length của input
                if (isRuleHasValue) {
                    inputLengthRule = rule.split(':')

                    rule = inputLengthRule[0]
                }

                var ruleFunction = validatorRules[rule]

                if (isRuleHasValue) {
                    ruleFunction = ruleFunction(inputLengthRule[1])
                }
                
                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunction)
                } else {
                    formRules[input.name] = [ruleFunction]
                }
            }

            // Lắng nghe sự kiện để validate cho từng input
            input.onblur = handleValidate
            input.oninput = handleClearError
        }

        // Hàm thực hiện các validate cho input
        function handleValidate(event) {
            var rules = formRules[event.target.name]
            var errorMessage

            rules.some(function(rule) {
                errorMessage = rule(event.target.value)
                return errorMessage
            })

            // Nếu có lỗi thì hiển thị message lỗi ra UI
            if (errorMessage) {
                var formGroup = getParent(event.target, '.form-group')
                if (formGroup) {
                    formGroup.classList.add('invalid')

                    var formMessage = formGroup.querySelector('.form-message')
                    if (formMessage) {
                        formMessage.innerText = errorMessage
                    }
                }
            }

            return !errorMessage
        }

        // Clear message lỗi khi nhập input
        function handleClearError(event) {
            var formGroup = getParent(event.target, '.form-group')
            if (formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid')

                var formMessage = formGroup.querySelector('.form-message')
                if (formMessage) {
                    formMessage.innerText = ''
                }
            }
        }

        // console.log(formRules)
    }

    // Xử lý hành vi submit form
    formElement.onsubmit = function(event) {
        event.preventDefault()

        var inputElements = formElement.querySelectorAll('[name][rules]')
        var isFormValid = true

        // Duyệt qua từng input
        for (var input of inputElements) {
            if (!handleValidate({ target: input })) {
                isFormValid = false
            }
        }

        // Nếu không có lỗi thì submit form
        if (isFormValid) {
            if (typeof _this.onSubmit === 'function') {
                var enableInputs = formElement.querySelectorAll("[name]:not([disabled])")
                var formValues = Array.from(enableInputs).reduce(function (values,input) {
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
                },{})

                // gọi lại hàm onSubmit và trả về kèm giá trị input của form
                _this.onSubmit(formValues)
            } else {
                formElement.submit()
            }
        }
    }
}