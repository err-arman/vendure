import {query} from './api';
import {GetActiveCustomerQuery} from './queries';
import {cache} from "react";
import {readFragment} from "@/graphql";
import {ActiveCustomerFragment} from "@/lib/vendure/fragments";
import {getAuthToken} from "@/lib/auth";


export const getActiveCustomer = cache(async () => {
    const token = await getAuthToken();
    const result = await query(GetActiveCustomerQuery, undefined, {
        token
    });
    return readFragment(ActiveCustomerFragment, result.data.activeCustomer);
})
