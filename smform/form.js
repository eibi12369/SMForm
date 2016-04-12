/*
 A simple Ajax Form Plugin
 Version 0.1
 */

(function($) {
	function askForUserLogin(h2_text)
	{
		if(USER) return false;

		var skip_login = false;
		if(skip_login) $('.up-slider .bottom-div.skip').show();

		if(!skip_login)
		{
			if(USING_IE6) { $(window).scrollTop(0); };

			var slider_id = '#signup-box';
			upSliderOpen(slider_id, h2_text);
			return false;
		}
	}

	$('form[data-ajax]').each(function()
	{
		var $form = $(this);
		//var $input = $form.find('input[type=submit]');
		//$input.after($.parseHTML("<span class='loading form-loading' style='display:none;'>&nbsp;</span>"));
		//$input.parent().append($.parseHTML("<span class='submit-message' style='display:none;'></span>"));
		
		if($form.attr('data-submit') == "onChange")
		{
			$form.change(function()
			{
				$(this).submit();
			});
		}
	});

	function field_validate($this, type, name, $parent, $error_msg)
	{
		var error = false;
		if(type.indexOf('required') != -1)
		{
			var val = $.trim($this.val()) || '';
			if(!val || val == "0")
			{
				error = name + ' is required';
			}
		}
		if(type.indexOf('email') != -1 && $this.val())
		{
			if(!validateEmail($this.val()))
			{
				error = 'Enter a valid email';
			}

		}
		if(type.indexOf('password') != -1 && $this.val())
		{
			if($this.val().length < 3)
			{
				error = 'Password should be atleast 3 characters long';
			}
			else if($this.val().length > 1000)
			{
				error = 'Password can be maximum 1000 characters long';
			}
		}

		if(error)
		{
			$parent.addClass('has-error');
			$error_msg.text(error).show();
			return false;
		}

		return true;
	}

	function form_validate($form)
	{
		var validated = true;

		$form.find('*[data-validate]').each(function()
		{
			var $this = $(this);
			var $parent = $this.closest('p');

			var type = $this.attr('data-validate');
			var name = $this.attr('data-name') || $this.attr('name') || 'Field';
			var $error_msg = $parent.find('.error-msg');

			validated =  field_validate($this, type, name, $parent, $error_msg) && validated;
		});

		if(!validated)
		{
			var offset_top = $form.find('.has-error').offset().top;
			if($(window).scrollTop() > offset_top)
			{
				$(window).scrollTop(offset_top);
			}
		}

		return validated;
	}

	$('form *[data-validate]').each(function()
	{
		var $this = $(this);
		var $parent = $this.closest('p');
		
		var type = $this.attr('data-validate');
		var name = $this.attr('data-name') || $this.attr('name');
		var $error_msg = $parent.find('.error-msg');

		$this.focus(function()
		{
			$parent.removeClass('has-error');
			$error_msg.hide();
		});

		$this.blur(function()
		{
			return field_validate($this, type, name, $parent, $error_msg);
		});
	});

	function to_qs(object)
	{
		var qs = '';
		var delim = '';
		for(var key in object)
		{
			if(object.hasOwnProperty(key))
			{
				qs += delim + key + '=' + object[key];
				delim = '&';
			}
		}

		return qs;
	}

	function make_url(url, options)
	{
		options = options || {};

		var qs = options.qs ? '&' + options.qs : "";
		delete options.qs;

		url += (url.indexOf('?') === -1) ? '?' : '&';

		return url + to_qs(options) + qs;
	}

	function submitForm($form, options)
    {
	/* 	AjaxOptions			HTML attribute
		FormAction			data-action
		AutoSubmit			data-submit
		Confirm				data-confirm
		HttpMethod			method
		InsertionMode		data-mode
		LoadingElementDuration	data-ajax-loading-duration
		LoadingElementId	data-loading
		OnBegin				data-begin
		OnComplete			data-complete
		OnFailure			data-failure
		OnSuccess			data-success
		UpdateTargetId		data-update
		UpdateTargetJquerySelection		data-updates
		ResetOnSuccess      data-reset
	 */	
		var $button = $form.find('input[type=submit]');

		var login_required = $form.attr('data-login');

		if(!form_validate($form))
		{
			return false;
		}

		if(login_required)
		{
			var click_params = {};
			click_params.page_type = PAGE_TYPE;
			click_params.click_source = 'form-' + $form.id;
			submitClickEvent(click_params);

			var skip_login = false;
			if(!USER && !skip_login)
			{
				askForUserLogin(h2_text);
					
				return false;
			}
		}

		var url = $form.attr('action') || $form.attr('href') || options.action;
		var method = $form.attr('method') || options.method;

		//$button.prop('disabled', true).addClass('disabled');
		$button.button('loading');
		$form.find('.submit-message').hide();
		$form.find('.form-loading').show();

		var form_id = $form.attr('id');
		var click_src = $form.attr('data-src');

        options.beforeSubmit();
		var handle_submit = function(response)
		{
            $form.trigger('response', response);

			//$button.prop('disabled', false).removeClass('disabled');
			$button.button('reset');
			$form.find('.form-loading').hide();

			var resJson = $.parseJSON(response);

			if(resJson.redirect)
			{
				resJson.message = '';
				window.location = resJson.redirect;
			}

            var res = resJson.message;
            var form_message;
            if($.type(res) === "string")
            {
                form_message = res;
            }
            else if($.isPlainObject(res))
            {
                form_message = res.message || form_message;
            }

			if(resJson.status == 'success')
			{
                form_message = form_message || 'Success';
                var data_reset = $form.attr("data-reset");
                if(data_reset) $form[0].reset();

                $form.find('.submit-message').removeClass('error').addClass('success').html(form_message).show();

                //************** OUT-DATED ***************************//
				if(res.html)
				{
					var select;
					var $target;
										
					if(select = $form.attr("data-update"))
					{
						$target = $("#" + select);
					}
					else if(select = $form.attr("data-updates"))
					{
						$target = $(select);
					}
					
					if($target)
					{
						var data_mode = $form.attr("data-mode");
						var parseHTML = $.parseHTML(res.html);
						
						if(data_mode == "prepend")
						{
							$target.prepend(parseHTML);
						}
						else if(data_mode == "after")
						{
							$target.after(parseHTML);
						}
						else if(data_mode == "before")
						{
							$target.before(parseHTML);
						}
						else if(data_mode == "html")
						{
							// Replace innerHTML
							$target.html(res.html);
						}
						else if(data_mode == "replaceWith")
						{
							// Replace All
							$target.replaceWith(parseHTML);
						}
						else if(data_mode == "innerHTML")
						{
							$target.innerHTML = HTML;
						}
						else if(data_mode == "remove")
						{
							$target.remove();
						}
						else
						{
							$target.append(parseHTML);
						}
					}
				}

                if(res.data)
                {
                    var data = res.data;

                    if(typeof(data) == 'object')
                    {
                        $.each(data, function()
                        {
                            updateHTML($(this)[0]);
                        });
                    }
                }
				
				var data_success = $form.attr("data-success");
				if(data_success)
				{
					execute(data_success);
				}
			}
			else
			{
                form_message = form_message || 'Failed';
				$form.find('.submit-message').removeClass('success').addClass('error').html(form_message).show();
				if(Object.prototype.toString.call(res.errors) === '[object Object]')
				{
					$.each(res.errors, function(key, value)
					{
						$form.find('input[type=password]').val('');
						$form.find('input[name="' + key + '"]').closest('.form-group').addClass('has-error').find('.with-errors').html(value).show();
					});
				}
				
				// why???
				// $('html, body').animate({scrollTop: $form.offset().top - top_space_in_tabs}, 200);
			}
		};

		$form.trigger('submitted');
        var form_data = collectInput($form);

        var extra_data = {};
        if($form.attr('data-hval')) extra_data['form-data-hval'] = $form.attr('data-hval');
        if($form.id) extra_data['src-form-id'] = $form.id;
        if(click_src) extra_data['click-src'] = click_src;
        if($form.attr("data-action")) extra_data['data-action'] = $form.attr("data-action");

        if(!$.isEmptyObject(extra_data))
        {
            form_data = $.extend(form_data, extra_data);
        }

        if(options.inputSource)
        {
            $.each(options.inputSource, function(key, value)
            {
                if($.type(value) === "string")
                {
                    $(value).each(function()
                    {
                        var d = collectInput($(this));
                        form_data = $.extend(form_data, d);
                    });
                }
                else
                {
                    var d = collectInput(value);
                    form_data = $.extend(form_data, d);
                }
            });
        }

        form_data = $.extend(form_data, options.extraInput);
        var form_data_params = $.param(form_data);
		url = make_url(url);
		var jqxhr;

        if(options.hiddenForm)
        {
            var form_attr = {
                action      : url,
                method      : method
            };

            $_form = $(document.createElement('form'));
            $_form.attr(form_attr);
            $.each(form_data, function(k, v)
            {
                if($.isArray(v))
                {
                    $.each(v, function(k2, v2)
                    {
                        $_form.append('<input type="hidden" name="'+k+'" value="'+v2+'">');
                    });
                }
                else
                {
                    $_form.append('<input type="hidden" name="'+k+'" value="'+v+'">');
                }
            });

            $_form.submit();
            return false;
        }
        console.log(form_data_params);

        jqxhr = $.ajax({
            url         : url,
            beforeSend  : options.beforeSend(),
            data        : form_data_params,
            method      : method
        })
            .done(function(response)
            {
                handle_submit(response);
                options.onSuccess($form);
                $form.trigger('success');
                //alert( "second success" );
            })
            .complete(function()
            {
                //alert( "error" );
            })
            .fail(function()
            {
                //alert( "error" );
            })
            .always(function()
            {
                //alert( "finished" );
            });

		return false;
	}

    function collectInput($ele)
    {
        var form_data = {};
        if($.isFunction($ele))
        {
            form_data = $ele();
        }
        else if($.isPlainObject($ele))
        {
            form_data = $ele;
        }
        else if($ele.is('form, input, select, textarea'))
        {
            form_data = $ele.serializeObject();
        }
        else
        {
            $ele.find('input, select, textarea').each(function()
            {
                if($(this).attr('type') === 'submit')
                {
                    return;
                }
                else if($(this).attr('type') === 'checkbox' || $(this).attr('type') === 'radio')
                {
                    if($(this).prop('checked') === true)
                    {
                        if($(this).attr('name').endsWith('[]'))
                        {
                            if(typeof form_data[$(this).attr('name')] === 'undefined') form_data[$(this).attr('name')] = [];
                            form_data[$(this).attr('name')].push($(this).val());
                            console.log(form_data);
                            console.log($.param(form_data));
                        }
                        else
                        {
                            form_data[$(this).attr('name')] = $(this).val();
                        }
                    }
                }
                else
                {
                    form_data[$(this).attr('name')] = $(this).val();
                }
            });
        }

        return form_data;
    }

    function nameWithArray()
    {

    }

    function updateHTML(data)
    {
        var select = data.data_update;
        $target = $(select);
        //console.log(data);
        if($target)
        {
            var data_mode = data.data_mode;
            var parseHTML = $.parseHTML(data.html);

            if(data_mode == "prepend")
            {
                $target.prepend(parseHTML);
            }
            else if(data_mode == "after")
            {
                $target.after(parseHTML);
            }
            else if(data_mode == "before")
            {
                $target.before(parseHTML);
            }
            else if(data_mode == "html")
            {
                // Replace innerHTML
                $target.html(parseHTML);
            }
            else if(data_mode == "replaceWith")
            {
                // Replace All
                $target.replaceWith(parseHTML);
            }
            else if(data_mode == "innerHTML")
            {
                $target.innerHTML = HTML;
            }
            else if(data_mode == "remove")
            {
                $target.remove();
            }
            else
            {
                $target.append(parseHTML);
            }
        }
    }

	function execute(code) 
	{
		try 
		{ 
			window.eval(code); 
		} 
		catch(e) 
		{ 
			console.error(e); 
		}
	}

    $.smform = function($el, options) {
        options = $.extend({}, $.smform.defaults, options);
        options.onInit();

        $el.on(options.eventName, function(event) {
            event.preventDefault();
            submitForm($el, options);
            return false;
        });
    };

    $.smform.defaults = {
        onInit          : function() {},
        onBegin         : function() {},
        beforeSend      : function() {},
        beforeSubmit    : function() {},
        beforeSerialize : function() {},
        onSubmit        : function() {},
        onComplete      : function() {},
        onSuccess       : function() {},
        onFailure       : function() {},
        action     		: '',
        method     		: 'GET',
        autoSubmit		: false,
        askConfirmation	: false,
        resetOnSuccess  : false,
        eventName       : 'submit',
        inputSource     : [],
        extraInput      : {},
        hiddenForm      : false
    };

    // Plugin Definition
    $.fn.smform = function(options) {
        this.each(function()
        {
            current = new $.smform($(this), options);
        });

        return this;
    };

    $('form[data-ajax]').smform();
    $('a[data-ajax]').smform({eventName : 'click'});
})(jQuery);

$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};