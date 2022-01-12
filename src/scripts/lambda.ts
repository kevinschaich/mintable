import transact from './fetch'

export const lambdaHandler = async (event: any, context: any) => {

    await transact()
    
};