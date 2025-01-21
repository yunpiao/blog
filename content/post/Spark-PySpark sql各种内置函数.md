---
title: Spark-PySpark sql各种内置函数
date: 2022-04-12T10:39:46+08:00
draft: false
toc: true
---
<!--more-->
```python
_functions = {
    'lit': 'Creates a :class:`Column` of literal value.',
    'col': 'Returns a :class:`Column` based on the given column name.',
    'column': 'Returns a :class:`Column` based on the given column name.',
    'asc': 'Returns a sort expression based on the ascending order of the given column name.',
    'desc': 'Returns a sort expression based on the descending order of the given column name.',

    'upper': 'Converts a string expression to upper case.',
    'lower': 'Converts a string expression to upper case.',
    'sqrt': 'Computes the square root of the specified float value.',
    'abs': 'Computes the absolute value.',

    'max': 'Aggregate function: returns the maximum value of the expression in a group.',
    'min': 'Aggregate function: returns the minimum value of the expression in a group.',
    'count': 'Aggregate function: returns the number of items in a group.',
    'sum': 'Aggregate function: returns the sum of all values in the expression.',
    'avg': 'Aggregate function: returns the average of the values in a group.',
    'mean': 'Aggregate function: returns the average of the values in a group.',
    'sumDistinct': 'Aggregate function: returns the sum of distinct values in the expression.',
}

_functions_1_4 = {
    # unary math functions
    'acos': 'Computes the cosine inverse of the given value; the returned angle is in the range' +
            '0.0 through pi.',
    'asin': 'Computes the sine inverse of the given value; the returned angle is in the range' +
            '-pi/2 through pi/2.',
    'atan': 'Computes the tangent inverse of the given value.',
    'cbrt': 'Computes the cube-root of the given value.',
    'ceil': 'Computes the ceiling of the given value.',
    'cos': 'Computes the cosine of the given value.',
    'cosh': 'Computes the hyperbolic cosine of the given value.',
    'exp': 'Computes the exponential of the given value.',
    'expm1': 'Computes the exponential of the given value minus one.',
    'floor': 'Computes the floor of the given value.',
    'log': 'Computes the natural logarithm of the given value.',
    'log10': 'Computes the logarithm of the given value in Base 10.',
    'log1p': 'Computes the natural logarithm of the given value plus one.',
    'rint': 'Returns the double value that is closest in value to the argument and' +
            ' is equal to a mathematical integer.',
    'signum': 'Computes the signum of the given value.',
    'sin': 'Computes the sine of the given value.',
    'sinh': 'Computes the hyperbolic sine of the given value.',
    'tan': 'Computes the tangent of the given value.',
    'tanh': 'Computes the hyperbolic tangent of the given value.',
    'toDegrees': '.. note:: Deprecated in 2.1, use degrees instead.',
    'toRadians': '.. note:: Deprecated in 2.1, use radians instead.',
    'bitwiseNOT': 'Computes bitwise not.',
}

_functions_1_6 = {
    # unary math functions
    'stddev': 'Aggregate function: returns the unbiased sample standard deviation of' +
              ' the expression in a group.',
    'stddev_samp': 'Aggregate function: returns the unbiased sample standard deviation of' +
                   ' the expression in a group.',
    'stddev_pop': 'Aggregate function: returns population standard deviation of' +
                  ' the expression in a group.',
    'variance': 'Aggregate function: returns the population variance of the values in a group.',
    'var_samp': 'Aggregate function: returns the unbiased variance of the values in a group.',
    'var_pop':  'Aggregate function: returns the population variance of the values in a group.',
    'skewness': 'Aggregate function: returns the skewness of the values in a group.',
    'kurtosis': 'Aggregate function: returns the kurtosis of the values in a group.',
    'collect_list': 'Aggregate function: returns a list of objects with duplicates.',
    'collect_set': 'Aggregate function: returns a set of objects with duplicate elements' +
                   ' eliminated.',
}

_functions_2_1 = {
    # unary math functions
    'degrees': 'Converts an angle measured in radians to an approximately equivalent angle ' +
               'measured in degrees.',
    'radians': 'Converts an angle measured in degrees to an approximately equivalent angle ' +
               'measured in radians.',
}

_functions_2_2 = {
    'to_date': 'Converts a string date into a DateType using the (optionally) specified format.',
    'to_timestamp': 'Converts a string timestamp into a timestamp type using the ' +
                    '(optionally) specified format.',
}

# math functions that take two arguments as input
_binary_mathfunctions = {
    'atan2': 'Returns the angle theta from the conversion of rectangular coordinates (x, y) to' +
             'polar coordinates (r, theta).',
    'hypot': 'Computes ``sqrt(a^2 + b^2)`` without intermediate overflow or underflow.',
    'pow': 'Returns the value of the first argument raised to the power of the second argument.',
}

_window_functions = {
    'row_number':
        """returns a sequential number starting at 1 within a window partition.""",
    'dense_rank':
        """returns the rank of rows within a window partition, without any gaps.

        The difference between rank and dense_rank is that dense_rank leaves no gaps in ranking
        sequence when there are ties. That is, if you were ranking a competition using dense_rank
        and had three people tie for second place, you would say that all three were in second
        place and that the next person came in third. Rank would give me sequential numbers, making
        the person that came in third place (after the ties) would register as coming in fifth.

        This is equivalent to the DENSE_RANK function in SQL.""",
    'rank':
        """returns the rank of rows within a window partition.

        The difference between rank and dense_rank is that dense_rank leaves no gaps in ranking
        sequence when there are ties. That is, if you were ranking a competition using dense_rank
        and had three people tie for second place, you would say that all three were in second
        place and that the next person came in third. Rank would give me sequential numbers, making
        the person that came in third place (after the ties) would register as coming in fifth.

        This is equivalent to the RANK function in SQL.""",
    'cume_dist':
        """returns the cumulative distribution of values within a window partition,
        i.e. the fraction of rows that are below the current row.""",
    'percent_rank':
        """returns the relative rank (i.e. percentile) of rows within a window partition.""",
}

```