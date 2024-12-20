module Tests exposing (..)

import Expect
import Pages.Schedule exposing (filterEvents)
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "Schedule Logic"
        [ test "we can filter the schedule to match input" <|
            \_ ->
                Expect.equal
                    (filterEvents [ "Eat breakfast", "Workout" ] "Eat")
                    [ "Eat breakfast" ]
        , test "if nothing matches, nothing is returned" <|
            \_ ->
                Expect.equal
                    (filterEvents [ "Eat breakfast", "Workout" ] "drink coffee")
                    []
        , test "if the query matches multiple items in the list return all the items that contains the query" <|
            \_ ->
                Expect.equal
                    (filterEvents [ "Eat breakfast", "Workout", "Eat lunch" ] "Eat")
                    [ "Eat breakfast", "Eat lunch" ]
        ]
