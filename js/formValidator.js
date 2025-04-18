class ModernFormValidator {
    constructor(formSelector, options = {}) {
        this.form = document.querySelector(formSelector);
        if (!this.form) {
            console.error(`Formulaire "${formSelector}" non trouvé`);
            return;
        }

        this.defaultOptions = {
            errorClass: 'error',
            successClass: 'success',
            errorMessageClass: 'error-message',
            animationDuration: 300,
            validateOnInput: true,
            validateOnBlur: true,
            onSuccess: null,
            customValidators: {},
            errorMessages: {
                required: 'Ce champ est obligatoire',
                email: 'Veuillez entrer une adresse email valide',
                minLength: 'Ce champ doit contenir au moins {value} caractères',
                maxLength: 'Ce champ ne doit pas dépasser {value} caractères',
                min: 'La valeur minimale est {value}',
                max: 'La valeur maximale est {value}',
                number: 'Veuillez entrer un nombre valide',
                alphanumeric: 'Ce champ ne doit contenir que des lettres et des chiffres',
                password: 'Le mot de passe doit contenir au moins 8 caractères, incluant une majuscule, une minuscule et un chiffre',
                match: 'Ce champ doit correspondre au champ {value}',
                phone: 'Veuillez entrer un numéro de téléphone valide',
                url: 'Veuillez entrer une URL valide',
                date: 'Veuillez entrer une date valide',
                custom: 'Format invalide'
            }
        };

        this.options = Object.assign({}, this.defaultOptions, options);
        this.validators = {
            required: this.validateRequired.bind(this),
            email: this.validateEmail.bind(this),
            minLength: this.validateMinLength.bind(this),
            maxLength: this.validateMaxLength.bind(this),
            min: this.validateMin.bind(this),
            max: this.validateMax.bind(this),
            number: this.validateNumber.bind(this),
            alphanumeric: this.validateAlphanumeric.bind(this),
            password: this.validatePassword.bind(this),
            match: this.validateMatch.bind(this),
            phone: this.validatePhone.bind(this),
            url: this.validateUrl.bind(this),
            date: this.validateDate.bind(this),
            ...this.options.customValidators
        };

        this.init();
    }

    init() {
        if (!this.form) return;

        this.fields = Array.from(this.form.querySelectorAll('[data-validate]'));

        this.form.addEventListener('submit', this.handleSubmit.bind(this));

        if (this.options.validateOnInput) {
            this.fields.forEach(field => {
                field.addEventListener('input', () => this.validateField(field));
            });
        }

        if (this.options.validateOnBlur) {
            this.fields.forEach(field => {
                field.addEventListener('blur', () => this.validateField(field));
            });
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        const isValid = this.validateAllFields();

        if (isValid && typeof this.options.onSuccess === 'function') {
            this.options.onSuccess(this.form);
        }
    }

    validateAllFields() {
        let isValid = true;

        this.fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(field) {
        const validationRules = field.dataset.validate.split(',');
        const formGroup = this.getFormGroup(field);
        const errorMessageElement = formGroup.querySelector(`.${this.options.errorMessageClass}`);

        this.removeFieldState(formGroup);

        for (const rule of validationRules) {
            const [validatorName, param] = rule.trim().split(':');
            const validator = this.validators[validatorName];

            if (!validator) {
                console.warn(`Validateur "${validatorName}" non défini`);
                continue;
            }

            const isValid = validator(field, param);

            if (!isValid) {
                this.showError(formGroup, errorMessageElement, validatorName, param);
                return false;
            }
        }

        this.showSuccess(formGroup);
        return true;
    }

    showError(formGroup, errorElement, validatorName, param) {
        formGroup.classList.add(this.options.errorClass);
        formGroup.classList.remove(this.options.successClass);

        if (errorElement) {
            let errorMessage = this.options.errorMessages[validatorName] || this.options.errorMessages.custom;

            if (param) {
                let fieldName = '';
                if (validatorName === 'match') {
                    const matchField = this.form.querySelector(`[name="${param}"]`);
                    if (matchField && matchField.previousElementSibling) {
                        fieldName = matchField.previousElementSibling.textContent;
                    }
                }

                errorMessage = errorMessage.replace('{value}', fieldName || param);
            }

            errorElement.textContent = errorMessage;
        }
    }

    showSuccess(formGroup) {
        formGroup.classList.remove(this.options.errorClass);
        formGroup.classList.add(this.options.successClass);
    }

    removeFieldState(formGroup) {
        formGroup.classList.remove(this.options.errorClass, this.options.successClass);
    }

    getFormGroup(field) {
        return field.closest('.form-group') || field.parentElement;
    }

    // Validators
    validateRequired(field) {
        if (field.type === 'checkbox' || field.type === 'radio') {
            return field.checked;
        }

        return field.value.trim() !== '';
    }

    validateEmail(field) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(field.value.trim());
    }

    validateMinLength(field, minLength) {
        return field.value.length >= parseInt(minLength, 10);
    }

    validateMaxLength(field, maxLength) {
        return field.value.length <= parseInt(maxLength, 10);
    }

    validateMin(field, min) {
        return parseFloat(field.value) >= parseFloat(min);
    }

    validateMax(field, max) {
        return parseFloat(field.value) <= parseFloat(max);
    }

    validateNumber(field) {
        return !isNaN(field.value) && isFinite(field.value);
    }

    validateAlphanumeric(field) {
        return /^[a-zA-Z0-9]+$/.test(field.value);
    }

    validatePassword(field) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\S]{8,}$/;
        return passwordRegex.test(field.value);
    }

    validateMatch(field, targetFieldName) {
        const targetField = this.form.querySelector(`[name="${targetFieldName}"]`);
        return targetField && field.value === targetField.value;
    }

    validatePhone(field) {
        const phoneRegex = /^(?:\+\d{1,3}\s?)?(?:\(\d{1,4}\)\s?)?(?:[0-9]\s?){6,14}[0-9]$/;
        return field.value === '' || phoneRegex.test(field.value.trim());
    }

    validateUrl(field) {
        try {
            new URL(field.value);
            return true;
        } catch (e) {
            return false;
        }
    }

    validateDate(field) {
        return !isNaN(Date.parse(field.value));
    }

    // API publique
    reset() {
        this.form.reset();

        this.fields.forEach(field => {
            const formGroup = this.getFormGroup(field);
            this.removeFieldState(formGroup);
        });
    }

    addValidator(name, validatorFn, errorMessage) {
        this.validators[name] = validatorFn;

        if (errorMessage) {
            this.options.errorMessages[name] = errorMessage;
        }
    }

    setErrorMessage(validatorName, message) {
        this.options.errorMessages[validatorName] = message;
    }
}