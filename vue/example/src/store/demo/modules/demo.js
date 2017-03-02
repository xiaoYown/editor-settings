import Vue								from 'vue';
import { saveCookie } 					from 'tools/client'; 
import { httpResponse, getAttribute } 	from 'tools/utils'; 

import api								from '../api';
import * as types 						from './types';

const state = {
    stateShow: {},
    calData: 0,
};
/** state 操作说明
 *  @param String method get/add/del/put 请求首次获取 / 增 / 删 / 改 
 */
const mutations = {
	
    [types.SAVE_STATE_SHOW]( state, payload ){
        switch( payload.method ){
			case 'put':
				state.stateShow = payload.data;
				break;
		}
    },
    [types.SAVE_CAL_DATA]( state, payload ){
        switch(payload.method){
            case 'put':
                state.calData = payload.data;
                break;
        }
    },
};

const actions = {
	
    saveStateShow: ({ commit }, param) => {
        commit(types.SAVE_STATE_SHOW, param);
    },
    saveCalData: ({ commit }, param) => {
        commit(types.SAVE_CAL_DATA, param);
    },
};

export default {
    state, mutations, actions
};