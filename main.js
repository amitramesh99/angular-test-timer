var app = angular.module('myApp',[]);

//CONTROLLERS
app.controller('formCtrl', ['$scope', 'visibilityUpdater', 'formFactory', function($scope, visibilityUpdater, formFactory){
    $scope.form = visibilityUpdater.getVisibility('form');
    $scope.formFields = formFactory.getTimerSequences();

    var lastEdit = "time";
    $scope.calcDependencies = function(index, field){
        if(field === "time"){
            lastEdit = "time";
            console.log("Calculating questionDelay");
            $scope.formFields[index].questionDelay = Math.floor($scope.formFields[index].time * 60 / $scope.formFields[index].questions);
        }
        else if (field === "questionDelay") {
            console.log("Calculating time");
            lastEdit = "questionDelay";
            //***Round up***
            $scope.formFields[index].time = Math.floor($scope.formFields[index].questionDelay * $scope.formFields[index].questions / 60);
        }
        else if(field === "questions"){
            if(lastEdit === "time"){
                console.log("Calculating questionDelay");
                $scope.formFields[index].questionDelay = Math.floor($scope.formFields[index].time * 60 / $scope.formFields[index].questions);
            }
            else if (lastEdit = "questionDelay") {
                console.log("Calculating time");
                $scope.formFields[index].time = Math.floor($scope.formFields[index].questionDelay * $scope.formFields[index].questions / 60);
            }
        }

    };

    //var questionDelay = Math.floor(((seconds)/questions)*1000);

    $scope.addInputRow = function(){
        formFactory.addInputRow();
    };

    $scope.clearInputRows = function(){
        formFactory.clearInputRows();
        $scope.formFields = formFactory.getTimerSequences();
    };

    $scope.submitForm = function(){
        formFactory.submitForm();
        $scope.formFields = formFactory.getTimerSequences();
        console.log("Form submit: success");
    };
}]);

app.controller('timerCtrl', ['$scope', 'visibilityUpdater', 'timerFactory', function($scope, visibilityUpdater, timerFactory){
    //test timer ctrl
    $scope.timer = visibilityUpdater.getVisibility('timer');
    $scope.timerData = timerFactory.getCurrentData();

    $scope.pauseButtonStatus = 'Pause';
    $scope.pauseTimer = function(){
        timerFactory.pauseTimer();
    };
    $scope.resetTimer = function(){
        timerFactory.resetTimer();
    };
    $scope.cancelTimer = function(){
        timerFactory.stopTimer();
    };
}]);

//FACTORIES
app.factory('visibilityUpdater', function(){
    var elementVisibility = {
        form: {
            isVisible:true
        },
        timer: {
            isVisible:false
        }
    };
    return{
        getVisibility: function(element){
            return elementVisibility[element];
            console.log(element+": "+elementVisibility.element.inspect.isVisible);
        },
        setVisibilty: function(){
            elementVisibility.form.isVisible = !elementVisibility.form.isVisible;
            elementVisibility.timer.isVisible = !elementVisibility.timer.isVisible;
        }
    };
});

app.factory('formFactory', ['visibilityUpdater', 'timerFactory', function(visibilityUpdater, timerFactory){
    var timerSequences = [
        {
            time:'45',
            questions:'75',
            questionDelay:'36'
        }
    ];

    var clearInputRows = function(){
        timerSequences = [
            {
                time:'',
                questions:'',
                questionDelay:''
            }
        ];
    };

    return{
        addInputRow: function(){
            timerSequences.push({time:'', questions:'', questionDelay:''});
        },
        clearInputRows: function(){
            clearInputRows();
        },
        getTimerSequences: function(){
            return timerSequences;
        },
        submitForm: function(){
            visibilityUpdater.setVisibilty();
            timerFactory.importSequence(timerSequences);
            //clearInputRows();
            console.log(timerSequences);
        }
    };
}]);

app.factory('timerFactory', ['visibilityUpdater', '$timeout',  function(visibilityUpdater, $timeout){
    var timerSequences = [];
    var questionTimes = [];
    var currentSequence = 0;
    var timerTimeout;
    var bufferTimeout;
    var isRunning = false;

    var currentData = {
        time:'',
        questionNumber:'',
        timerDuration:'',
        fullDuration:'',
        questions:'',
        questionDelay:''
    };

    function killTimer(){
        $timeout.cancel(timerTimeout);
        isRunning = false;
    }

    function initializeTimerSequences(newTimerSequences){
        currentSequence = 0;
        timerSequences = newTimerSequences;
        console.log(timerSequences);
        startSequence();
    }

    function startSequence(){
        $timeout.cancel(bufferTimeout);
        var minutes = timerSequences[currentSequence].time;
        var seconds = minutes * 60;
        var questions = timerSequences[currentSequence].questions;
        var questionDelay = timerSequences[currentSequence].questionDelay;

        currentData.questionNumber = 1;
        currentData.timerDuration = seconds;
        currentData.fullDuration = seconds;
        currentData.questions = questions;
        currentData.questionDelay = questionDelay;
        console.log(currentData);
        startTimer(seconds, questions, questionDelay, 0);
    }

    function startTimer(timerDuration, questions, questionDelay, currentQuestion){
        isRunning = true;
        var minutes = parseInt(timerDuration / 60, 10);
        var seconds = parseInt(timerDuration % 60, 10);
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;
        var fullTime = minutes +":"+ seconds;
        currentData.time = fullTime;
        currentData.timerDuration = timerDuration;
        if(timerDuration % questionDelay === 0 && currentQuestion < questions){
            currentQuestion++;
            currentData.questionNumber = currentQuestion;
        }

        console.log("timer duration: "+fullTime);
        timerDuration--;
        if(timerDuration >= 0){
            timerTimeout = $timeout(function(){
                startTimer(timerDuration, questions, questionDelay, currentQuestion)
            }, 1000);
        }
        else{
            console.log("count down finished...");
            killTimer();
            if(timerSequences.length > currentSequence + 1){
                currentData.time = "Section " + (currentSequence + 1) + " complete";
                currentSequence++;
                bufferTimeout = $timeout(function(){
                    startSequence();
                }, 3000);
            }
            else {
                console.log("all sequences done...");
                visibilityUpdater.setVisibilty();
            }

        }
    }
    return{
        //currentDisplay: currentDisplay,
        importSequence: function(timerSequences){
            initializeTimerSequences(timerSequences);
        },
        stopTimer: function(){
            killTimer();
            visibilityUpdater.setVisibilty();
        },
        resetTimer: function(){
            console.log("Reset");
            killTimer();
            //isRunning = true;
            startTimer(currentData.fullDuration, currentData.questions, currentData.questionDelay, 0);
        },
        pauseTimer: function(){
            console.log("Pause");
            if(isRunning){
                killTimer();
            }
            else{
                //isRunning = true;
                startTimer(currentData.timerDuration, currentData.questions, currentData.questionDelay, currentData.questionNumber);
            }

        },
        getCurrentData: function(){
            return currentData;
        }
    };
}]);

//DIRECTIVES
app.directive('arTimer', function(){
    return{
        restrict: 'E',
        templateUrl:'directives/timer.html',
        link: function(scope, element, attributes){
            element.addClass('arTimer');
        },
        controller: function($scope){
            //timer ctrl
        }
    };
});
